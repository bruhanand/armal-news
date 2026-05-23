import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb, type Db } from "./client";
import {
  adminSettings,
  categories,
  stories,
  storyCategories,
  type AdminSetting,
  type Category,
  type Story,
} from "./schema";
import type { CategorySlug } from "../constants/categories";

// Plain ILIKE search across title + short_summary. MVP volume is small;
// no full-text index needed (ADR 0004 § D).
function searchPredicate(q: string | undefined) {
  if (!q) return undefined;
  const trimmed = q.trim();
  if (!trimmed) return undefined;
  // Escape SQL LIKE metacharacters so a literal % or _ in the query
  // doesn't act as a wildcard. Backslash-escape the escape too.
  const escaped = trimmed
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  const pattern = `%${escaped}%`;
  return or(
    ilike(stories.title, pattern),
    ilike(stories.shortSummary, pattern),
  );
}

// A Drizzle transaction handle is structurally a Db with the same query API.
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export async function getPublishedStoryBySlug(
  slug: string,
): Promise<Story | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(stories)
    .where(and(eq(stories.slug, slug), eq(stories.status, "published")))
    .limit(1);
  return row ?? null;
}

export async function listCategories(): Promise<Category[]> {
  const db = getDb();
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export type ListPublishedStoriesArgs = {
  category?: CategorySlug;
  cursor?: string;
  limit?: number;
  q?: string;
};

export type ListPublishedStoriesResult = {
  items: Story[];
  nextCursor: string | null;
};

// Cursor format: `<publishedAt-iso>__<storyId-uuid>`. The `(published_at, id)`
// tuple is the order key — same id tiebreaker keeps pages stable when two
// stories share a published_at timestamp.
const CURSOR_SEPARATOR = "__";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ParsedCursor = { publishedAt: Date; id: string };

export function encodeCursor(row: { publishedAt: Date; id: string }): string {
  return `${row.publishedAt.toISOString()}${CURSOR_SEPARATOR}${row.id}`;
}

export function parseCursor(value: string): ParsedCursor | null {
  const idx = value.indexOf(CURSOR_SEPARATOR);
  if (idx < 0) return null;
  const isoPart = value.slice(0, idx);
  const idPart = value.slice(idx + CURSOR_SEPARATOR.length);
  if (!UUID_RE.test(idPart)) return null;
  const ms = Date.parse(isoPart);
  if (Number.isNaN(ms)) return null;
  return { publishedAt: new Date(ms), id: idPart };
}

export async function listPublishedStories(
  args: ListPublishedStoriesArgs = {},
): Promise<ListPublishedStoriesResult> {
  const db = getDb();
  const limit = args.limit ?? 50;
  const cursor = args.cursor ? parseCursor(args.cursor) : null;
  if (args.cursor && !cursor) {
    throw new Error(`malformed cursor: ${args.cursor}`);
  }

  // The `+1` row tells us whether another page exists without a separate
  // count query; trim it back before returning and emit the nextCursor from
  // the last row of the kept slice.
  const fetchLimit = limit + 1;

  // Tuple comparison `(published_at, id) < (cursor.publishedAt, cursor.id)`
  // gives a stable strict-after page in (DESC, DESC) order.
  const cursorPredicate = cursor
    ? sql`(${stories.publishedAt}, ${stories.id}) < (${cursor.publishedAt.toISOString()}, ${cursor.id})`
    : undefined;
  const search = searchPredicate(args.q);

  let rows: Story[];
  if (args.category) {
    const joined = await db
      .select({ story: stories })
      .from(stories)
      .innerJoin(storyCategories, eq(storyCategories.storyId, stories.id))
      .innerJoin(categories, eq(categories.id, storyCategories.categoryId))
      .where(
        and(
          eq(stories.status, "published"),
          eq(categories.slug, args.category),
          cursorPredicate,
          search,
        ),
      )
      .orderBy(desc(stories.publishedAt), desc(stories.id))
      .limit(fetchLimit);
    rows = joined.map((r) => r.story);
  } else {
    rows = await db
      .select()
      .from(stories)
      .where(
        and(eq(stories.status, "published"), cursorPredicate, search),
      )
      .orderBy(desc(stories.publishedAt), desc(stories.id))
      .limit(fetchLimit);
  }

  if (rows.length > limit) {
    const items = rows.slice(0, limit);
    const last = items[items.length - 1]!;
    return {
      items,
      nextCursor: encodeCursor({ publishedAt: last.publishedAt!, id: last.id }),
    };
  }
  return { items: rows, nextCursor: null };
}

// Admin list helpers. No cursor pagination here — the admin works at MVP
// volume (single human, dozens of drafts at most) and the design wires a
// status-scoped table per page. `q` runs the same ILIKE search predicate
// the published list uses (ADR 0004 § D).

export type ListByStatusArgs = { q?: string; limit?: number };

export async function listDraftStories(
  args: ListByStatusArgs = {},
): Promise<Story[]> {
  const db = getDb();
  return db
    .select()
    .from(stories)
    .where(and(eq(stories.status, "draft"), searchPredicate(args.q)))
    .orderBy(desc(stories.createdAt), desc(stories.id))
    .limit(args.limit ?? 200);
}

export async function listRejectedStories(
  args: ListByStatusArgs = {},
): Promise<Story[]> {
  const db = getDb();
  return db
    .select()
    .from(stories)
    .where(and(eq(stories.status, "rejected"), searchPredicate(args.q)))
    .orderBy(desc(stories.updatedAt), desc(stories.id))
    .limit(args.limit ?? 200);
}

export async function countStoriesByStatus(): Promise<{
  draft: number;
  published: number;
  rejected: number;
}> {
  const db = getDb();
  const rows = await db
    .select({ status: stories.status, n: count() })
    .from(stories)
    .groupBy(stories.status);
  const result = { draft: 0, published: 0, rejected: 0 };
  for (const r of rows) {
    result[r.status] = Number(r.n);
  }
  return result;
}

// Map of storyId → the lowest-sortOrder Category that the Story belongs to.
// Used by the feed to render the per-card eyebrow (desktop) and the
// per-card category icon (mobile, unfiltered chrome). DISTINCT ON
// (story_id) returns one row per Story directly from Postgres — the
// secondary ORDER BY sortOrder picks the deterministic winner.
export async function primaryCategoryByStoryIds(
  storyIds: readonly string[],
): Promise<Map<string, { slug: string; name: string; sortOrder: number }>> {
  if (storyIds.length === 0) return new Map();
  const db = getDb();
  const rows = await db
    .selectDistinctOn([storyCategories.storyId], {
      storyId: storyCategories.storyId,
      slug: categories.slug,
      name: categories.name,
      sortOrder: categories.sortOrder,
    })
    .from(storyCategories)
    .innerJoin(categories, eq(categories.id, storyCategories.categoryId))
    .where(inArray(storyCategories.storyId, storyIds as string[]))
    .orderBy(asc(storyCategories.storyId), asc(categories.sortOrder));

  return new Map(
    rows.map((r) => [
      r.storyId,
      { slug: r.slug, name: r.name, sortOrder: r.sortOrder },
    ]),
  );
}

// Map of storyId → list of category slugs. Used by the admin tables to
// render the Categories column.
export async function categorySlugsByStoryIds(
  storyIds: readonly string[],
): Promise<Map<string, string[]>> {
  if (storyIds.length === 0) return new Map();
  const db = getDb();
  const rows = await db
    .select({
      storyId: storyCategories.storyId,
      slug: categories.slug,
      sortOrder: categories.sortOrder,
    })
    .from(storyCategories)
    .innerJoin(categories, eq(categories.id, storyCategories.categoryId))
    .where(inArray(storyCategories.storyId, storyIds as string[]))
    .orderBy(asc(categories.sortOrder));

  const map = new Map<string, string[]>();
  for (const r of rows) {
    if (!map.has(r.storyId)) map.set(r.storyId, []);
    map.get(r.storyId)!.push(r.slug);
  }
  return map;
}

export async function getCategoryIdsBySlug(
  db: Db | Tx,
  slugs: readonly string[],
): Promise<string[]> {
  if (slugs.length === 0) return [];
  const rows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(inArray(categories.slug, slugs as string[]));
  const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));
  // Preserve caller order; missing slugs throw — zod already enforces the
  // seeded list, so a miss means the seed migration was rolled back mid-flight.
  return slugs.map((slug) => {
    const id = idBySlug.get(slug);
    if (!id) throw new Error(`category slug not found: ${slug}`);
    return id;
  });
}

// Single SELECT of every seeded Category. Use this when a caller needs to
// resolve many (slug → id) lookups in a tight loop (e.g. ingest batches) —
// resolves once per batch instead of once per Story.
export async function loadCategoryIdMap(
  db: Db | Tx,
): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories);
  return new Map(rows.map((r) => [r.slug, r.id]));
}

// Updates a Category's mutable fields. `slug` is intentionally not editable —
// it's the immutable join key the seed enum is locked to (ADR 0004 § F).
// Returns the updated row or null if the id doesn't exist.
export async function updateCategory(
  id: string,
  patch: { name?: string; sortOrder?: number },
): Promise<Category | null> {
  const set: { name?: string; sortOrder?: number } = {};
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.sortOrder !== undefined) set.sortOrder = patch.sortOrder;
  if (Object.keys(set).length === 0) {
    const [row] = await getDb()
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return row ?? null;
  }
  const [row] = await getDb()
    .update(categories)
    .set(set)
    .where(eq(categories.id, id))
    .returning();
  return row ?? null;
}

// admin_settings is key→jsonb. Each key owns its own value shape; readers
// validate before use. Upsert is the only write — the Settings page never
// "deletes" a key (an empty value just overwrites).
export async function upsertAdminSetting(
  key: string,
  value: unknown,
): Promise<AdminSetting> {
  const [row] = await getDb()
    .insert(adminSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: adminSettings.key,
      set: { value, updatedAt: new Date() },
    })
    .returning();
  return row!;
}

export async function getAdminSetting(
  key: string,
): Promise<AdminSetting | null> {
  const [row] = await getDb()
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, key))
    .limit(1);
  return row ?? null;
}

// Delete-then-insert reconciliation. The join has no other writers
// (OpenClaw is single-writer; the ingest loop is sequential) and the
// caller wraps this in a transaction, so the brief gap is not a
// visibility hazard.
export async function setStoryCategories(
  tx: Db | Tx,
  storyId: string,
  categoryIds: readonly string[],
): Promise<void> {
  await tx.delete(storyCategories).where(eq(storyCategories.storyId, storyId));
  if (categoryIds.length === 0) return;
  await tx.insert(storyCategories).values(
    categoryIds.map((categoryId) => ({ storyId, categoryId })),
  );
}

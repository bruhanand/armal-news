import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, type Db } from "./client";
import {
  categories,
  stories,
  storyCategories,
  type Category,
  type Story,
} from "./schema";
import type { CategorySlug } from "../constants/categories";

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
        ),
      )
      .orderBy(desc(stories.publishedAt), desc(stories.id))
      .limit(fetchLimit);
    rows = joined.map((r) => r.story);
  } else {
    rows = await db
      .select()
      .from(stories)
      .where(and(eq(stories.status, "published"), cursorPredicate))
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

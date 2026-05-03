import { and, asc, desc, eq, inArray } from "drizzle-orm";
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
  // cursor pagination lands in 0007.
  cursor?: string;
  limit?: number;
};

export async function listPublishedStories(
  args: ListPublishedStoriesArgs = {},
): Promise<Story[]> {
  const db = getDb();
  const limit = args.limit ?? 50;

  if (args.category) {
    const rows = await db
      .select({ story: stories })
      .from(stories)
      .innerJoin(storyCategories, eq(storyCategories.storyId, stories.id))
      .innerJoin(categories, eq(categories.id, storyCategories.categoryId))
      .where(
        and(
          eq(stories.status, "published"),
          eq(categories.slug, args.category),
        ),
      )
      .orderBy(desc(stories.publishedAt))
      .limit(limit);
    return rows.map((r) => r.story);
  }

  return db
    .select()
    .from(stories)
    .where(eq(stories.status, "published"))
    .orderBy(desc(stories.publishedAt))
    .limit(limit);
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

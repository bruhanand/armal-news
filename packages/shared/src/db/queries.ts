import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  categories,
  stories,
  storyCategories,
  type Category,
  type Story,
} from "./schema";

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
  category?: string;
  cursor?: string;
  limit?: number;
};

export async function listPublishedStories(
  args: ListPublishedStoriesArgs = {},
): Promise<Story[]> {
  const db = getDb();
  const limit = args.limit ?? 50;
  // cursor pagination lands in 0007.
  void args.cursor;

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

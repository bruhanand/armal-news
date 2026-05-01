import { and, eq } from "drizzle-orm";
import { getDb } from "./client";
import { stories, type Story } from "./schema";

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

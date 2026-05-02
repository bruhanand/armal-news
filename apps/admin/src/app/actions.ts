"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "@armal/shared/db";
import { isCategorySlug } from "@armal/shared/constants/categories";

export async function publishStory(id: string) {
  const db = getDb();
  await db
    .update(stories)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(stories.id, id));
  revalidatePath("/");
}

export async function updateStoryCategories(storyId: string, formData: FormData) {
  const slugs = formData.getAll("category_slugs").map(String);
  for (const slug of slugs) {
    if (!isCategorySlug(slug)) {
      throw new Error(`unknown category slug: ${slug}`);
    }
  }

  const db = getDb();
  const targetIds = slugs.length
    ? (
        await db
          .select({ id: categories.id })
          .from(categories)
          .where(inArray(categories.slug, slugs))
      ).map((c) => c.id)
    : [];

  await db.transaction(async (tx) => {
    await tx
      .delete(storyCategories)
      .where(eq(storyCategories.storyId, storyId));
    if (targetIds.length) {
      await tx
        .insert(storyCategories)
        .values(targetIds.map((cid) => ({ storyId, categoryId: cid })));
    }
  });

  revalidatePath("/");
}

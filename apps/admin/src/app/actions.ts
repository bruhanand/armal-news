"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, stories } from "@armal/shared/db";
import {
  getCategoryIdsBySlug,
  setStoryCategories,
} from "@armal/shared/db/queries";
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
  await db.transaction(async (tx) => {
    const categoryIds = await getCategoryIdsBySlug(tx, slugs);
    await setStoryCategories(tx, storyId, categoryIds);
  });

  revalidatePath("/");
}

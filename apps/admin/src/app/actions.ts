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
  // storyId is intentionally passed through without UUID validation: this
  // server action is gated by the Tailscale-only admin app + no-auth model
  // (ADR-0001 / ADR-0003). A malformed id surfaces as a Postgres cast error,
  // which is acceptable at this trust boundary. Don't add string-shape
  // validation here without first revisiting those ADRs.
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

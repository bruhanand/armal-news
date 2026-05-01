"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, stories } from "@armal/shared/db";

export async function publishStory(id: string) {
  const db = getDb();
  await db
    .update(stories)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(stories.id, id));
  revalidatePath("/");
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// next/cache pulls in Next runtime internals that aren't available in
// vitest's plain Node env. The server action's only side-effect on the
// cache is revalidatePath("/"), which the integration tests don't need
// to assert — stub it so the action can run.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { eq } from "drizzle-orm";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "@armal/shared/db";
import { updateStoryCategories } from "./actions";

async function seedDraft(externalId: string, initialSlugs: string[]) {
  const db = getDb();
  const [row] = await db
    .insert(stories)
    .values({
      externalId,
      slug: externalId,
      title: `Story ${externalId}`,
      shortSummary: "summary",
      bodyMarkdown: "# body",
      imageUrl: `https://test.example/${externalId}.jpg`,
      sourceLink: `https://test.example/${externalId}`,
      status: "draft",
    })
    .returning({ id: stories.id });

  if (initialSlugs.length > 0) {
    const cats = await db
      .select({ id: categories.id, slug: categories.slug })
      .from(categories);
    const idBySlug = new Map(cats.map((c) => [c.slug, c.id]));
    await db.insert(storyCategories).values(
      initialSlugs.map((slug) => ({
        storyId: row!.id,
        categoryId: idBySlug.get(slug)!,
      })),
    );
  }
  return row!.id;
}

async function joinSlugsFor(storyId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ slug: categories.slug })
    .from(storyCategories)
    .innerJoin(categories, eq(storyCategories.categoryId, categories.id))
    .where(eq(storyCategories.storyId, storyId));
  return rows.map((r) => r.slug).sort();
}

function form(slugs: string[]): FormData {
  const fd = new FormData();
  for (const s of slugs) fd.append("category_slugs", s);
  return fd;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateStoryCategories", () => {
  it("reconciles a draft's join rows when the slug set changes", async () => {
    const id = await seedDraft("act-rec-1", ["ai-in-tech", "ai-in-robotics"]);
    expect(await joinSlugsFor(id)).toEqual(["ai-in-robotics", "ai-in-tech"]);

    await updateStoryCategories(id, form(["ai-in-finance"]));
    expect(await joinSlugsFor(id)).toEqual(["ai-in-finance"]);

    await updateStoryCategories(
      id,
      form(["ai-in-healthcare", "ai-in-education"]),
    );
    expect(await joinSlugsFor(id)).toEqual([
      "ai-in-education",
      "ai-in-healthcare",
    ]);
  });

  it("is idempotent across repeated calls with the same slug set", async () => {
    const id = await seedDraft("act-idem-1", []);
    await updateStoryCategories(id, form(["ai-in-tech", "ai-in-robotics"]));
    await updateStoryCategories(id, form(["ai-in-tech", "ai-in-robotics"]));
    await updateStoryCategories(id, form(["ai-in-tech", "ai-in-robotics"]));
    expect(await joinSlugsFor(id)).toEqual(["ai-in-robotics", "ai-in-tech"]);
  });

  it("rejects an unseeded slug and leaves prior join rows untouched", async () => {
    const id = await seedDraft("act-bad-1", ["ai-in-tech"]);
    await expect(
      updateStoryCategories(id, form(["not-a-real-category"])),
    ).rejects.toThrow(/unknown category slug/);
    expect(await joinSlugsFor(id)).toEqual(["ai-in-tech"]);
  });
});

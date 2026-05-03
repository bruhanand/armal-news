import { describe, expect, it } from "vitest";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "@armal/shared/db";
import { GET } from "./route";

async function categoryIdMap(): Promise<Map<string, string>> {
  const rows = await getDb()
    .select({ id: categories.id, slug: categories.slug })
    .from(categories);
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function seedStory(opts: {
  externalId: string;
  status: "draft" | "published";
  publishedAt?: Date;
  categorySlugs?: string[];
}) {
  const db = getDb();
  const [row] = await db
    .insert(stories)
    .values({
      externalId: opts.externalId,
      slug: opts.externalId,
      title: opts.externalId,
      shortSummary: "summary",
      bodyMarkdown: "# body",
      imageUrl: `https://test.example/${opts.externalId}.jpg`,
      sourceLink: `https://test.example/${opts.externalId}`,
      status: opts.status,
      publishedAt: opts.publishedAt ?? null,
    })
    .returning({ id: stories.id });

  if (opts.categorySlugs?.length) {
    const idBySlug = await categoryIdMap();
    await db.insert(storyCategories).values(
      opts.categorySlugs.map((slug) => ({
        storyId: row!.id,
        categoryId: idBySlug.get(slug)!,
      })),
    );
  }
}

function feedRequest(qs = ""): Request {
  return new Request(`http://localhost:3000/api/feed${qs}`);
}

describe("GET /api/feed", () => {
  it("returns published Stories (drafts excluded) when no category is given", async () => {
    await seedStory({
      externalId: "pub-1",
      status: "published",
      publishedAt: new Date("2026-01-01"),
    });
    await seedStory({ externalId: "draft-1", status: "draft" });

    const res = await GET(feedRequest());
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      stories: Array<{ externalId: string }>;
    };
    expect(json.stories.map((s) => s.externalId)).toEqual(["pub-1"]);
  });

  it("filters by ?category=<slug>", async () => {
    await seedStory({
      externalId: "robo-1",
      status: "published",
      publishedAt: new Date("2026-01-01"),
      categorySlugs: ["ai-in-robotics"],
    });
    await seedStory({
      externalId: "tech-1",
      status: "published",
      publishedAt: new Date("2026-01-02"),
      categorySlugs: ["ai-in-tech"],
    });

    const res = await GET(feedRequest("?category=ai-in-robotics"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      stories: Array<{ externalId: string }>;
    };
    expect(json.stories.map((s) => s.externalId)).toEqual(["robo-1"]);
  });

  it("rejects an unknown category slug with HTTP 400 + { error }", async () => {
    const res = await GET(feedRequest("?category=garbage-not-a-real-slug"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(typeof json.error).toBe("string");
    expect(json.error).toMatch(/garbage-not-a-real-slug/);
  });
});

import { describe, expect, it } from "vitest";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "@armal/shared/db";
import type { FeedItem } from "@/app/feed/feedItem";
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
  bodyMarkdown?: string;
}) {
  const db = getDb();
  const [row] = await db
    .insert(stories)
    .values({
      externalId: opts.externalId,
      slug: opts.externalId,
      title: opts.externalId,
      shortSummary: "summary",
      bodyMarkdown: opts.bodyMarkdown ?? "# body",
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

type FeedResponse = { items: FeedItem[]; nextCursor: string | null };

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
    const json = (await res.json()) as FeedResponse;
    expect(json.items.map((s) => s.slug)).toEqual(["pub-1"]);
    expect(json.nextCursor).toBeNull();
  });

  it("filters by ?category=<slug> and exposes the primary category name", async () => {
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
    const json = (await res.json()) as FeedResponse;
    expect(json.items.map((s) => s.slug)).toEqual(["robo-1"]);
    expect(json.items[0]!.primaryCategorySlug).toBe("ai-in-robotics");
    expect(json.items[0]!.primaryCategoryName).toBe("AI in Robotics");
  });

  it("rejects an unknown category slug with HTTP 400 + { error }", async () => {
    const res = await GET(feedRequest("?category=garbage-not-a-real-slug"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(typeof json.error).toBe("string");
    expect(json.error).toMatch(/garbage-not-a-real-slug/);
  });

  it("rejects a malformed cursor with HTTP 400", async () => {
    const res = await GET(feedRequest("?cursor=garbage"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toMatch(/cursor/);
  });

  it("paginates: cursor returns the next page; final page emits nextCursor=null", async () => {
    for (let i = 0; i < 3; i++) {
      await seedStory({
        externalId: `s-${i}`,
        status: "published",
        publishedAt: new Date(2026, 0, i + 1),
      });
    }
    const page1 = (await (await GET(feedRequest("?limit=2"))).json()) as FeedResponse;
    expect(page1.items.map((i) => i.slug)).toEqual(["s-2", "s-1"]);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = (await (
      await GET(feedRequest(`?limit=2&cursor=${encodeURIComponent(page1.nextCursor!)}`))
    ).json()) as FeedResponse;
    expect(page2.items.map((i) => i.slug)).toEqual(["s-0"]);
    expect(page2.nextCursor).toBeNull();
  });

  it("computes readTimeMinutes from body length (≥ 1 minute)", async () => {
    await seedStory({
      externalId: "long",
      status: "published",
      publishedAt: new Date("2026-01-01"),
      bodyMarkdown: "x".repeat(4500),
    });
    const json = (await (await GET(feedRequest())).json()) as FeedResponse;
    expect(json.items[0]!.readTimeMinutes).toBe(3);
  });
});

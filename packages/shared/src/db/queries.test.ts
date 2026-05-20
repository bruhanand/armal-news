import { describe, expect, it } from "vitest";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "./index";
import {
  encodeCursor,
  getPublishedStoryBySlug,
  listCategories,
  listPublishedStories,
  parseCursor,
  primaryCategoryByStoryIds,
} from "./queries";

const haveDb = Boolean(process.env.DATABASE_URL);
const itDb = haveDb ? it : it.skip;

// Categories survive between tests (TRUNCATE on stories cascades only to
// story_categories), so the slug→id map is stable across the suite.
let categoryIdCache: Map<string, string> | null = null;
async function categoryIdMap(): Promise<Map<string, string>> {
  if (categoryIdCache) return categoryIdCache;
  const rows = await getDb()
    .select({ id: categories.id, slug: categories.slug })
    .from(categories);
  categoryIdCache = new Map(rows.map((r) => [r.slug, r.id]));
  return categoryIdCache;
}

async function makeStory(opts: {
  externalId: string;
  title: string;
  status: "draft" | "published" | "rejected";
  publishedAt?: Date;
  categorySlugs?: string[];
}) {
  const db = getDb();
  const [row] = await db
    .insert(stories)
    .values({
      externalId: opts.externalId,
      slug: opts.externalId,
      title: opts.title,
      shortSummary: `${opts.title} — summary`,
      bodyMarkdown: `# ${opts.title}`,
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
  return row!.id;
}

describe("listCategories", () => {
  itDb("returns all nine seeded categories in sort_order ASC", async () => {
    const rows = await listCategories();
    expect(rows).toHaveLength(9);
    const slugs = rows.map((r) => r.slug);
    expect(slugs).toEqual([
      "ai-in-tech",
      "ai-in-finance",
      "ai-in-healthcare",
      "ai-in-robotics",
      "ai-in-cooking",
      "ai-in-education",
      "ai-research",
      "ai-tools",
      "ai-policy-safety",
    ]);
    const sortOrders = rows.map((r) => r.sortOrder);
    expect(sortOrders).toEqual([...sortOrders].sort((a, b) => a - b));
  });
});

describe("listPublishedStories", () => {
  itDb("excludes drafts (and rejected)", async () => {
    await makeStory({
      externalId: "pub-1",
      title: "Published one",
      status: "published",
      publishedAt: new Date("2026-01-01"),
    });
    await makeStory({
      externalId: "draft-1",
      title: "Draft one",
      status: "draft",
    });
    const { items, nextCursor } = await listPublishedStories();
    expect(items.map((r) => r.externalId)).toEqual(["pub-1"]);
    expect(nextCursor).toBeNull();
  });

  itDb(
    "filters by category slug via the join; multi-category Story surfaces under each",
    async () => {
      await makeStory({
        externalId: "robo-only",
        title: "Robotics only",
        status: "published",
        publishedAt: new Date("2026-01-01"),
        categorySlugs: ["ai-in-robotics"],
      });
      await makeStory({
        externalId: "tech-only",
        title: "Tech only",
        status: "published",
        publishedAt: new Date("2026-01-02"),
        categorySlugs: ["ai-in-tech"],
      });
      await makeStory({
        externalId: "both",
        title: "Robotics and tech",
        status: "published",
        publishedAt: new Date("2026-01-03"),
        categorySlugs: ["ai-in-robotics", "ai-in-tech"],
      });

      const robotics = await listPublishedStories({
        category: "ai-in-robotics",
      });
      expect(robotics.items.map((r) => r.externalId).sort()).toEqual([
        "both",
        "robo-only",
      ]);

      const tech = await listPublishedStories({ category: "ai-in-tech" });
      expect(tech.items.map((r) => r.externalId).sort()).toEqual([
        "both",
        "tech-only",
      ]);

      const cooking = await listPublishedStories({
        category: "ai-in-cooking",
      });
      expect(cooking.items).toHaveLength(0);
    },
  );

  itDb("orders by published_at DESC", async () => {
    await makeStory({
      externalId: "old",
      title: "Old",
      status: "published",
      publishedAt: new Date("2026-01-01"),
    });
    await makeStory({
      externalId: "new",
      title: "New",
      status: "published",
      publishedAt: new Date("2026-02-01"),
    });
    await makeStory({
      externalId: "mid",
      title: "Mid",
      status: "published",
      publishedAt: new Date("2026-01-15"),
    });
    const { items } = await listPublishedStories();
    expect(items.map((r) => r.externalId)).toEqual(["new", "mid", "old"]);
  });

  itDb("returns tags as an empty array when none were ingested", async () => {
    await makeStory({
      externalId: "no-tags",
      title: "No tags",
      status: "published",
      publishedAt: new Date("2026-01-01"),
    });
    const { items } = await listPublishedStories();
    expect(items[0]?.tags).toEqual([]);
  });

  itDb("respects limit and emits nextCursor when more pages exist", async () => {
    for (let i = 0; i < 5; i++) {
      await makeStory({
        externalId: `s-${i}`,
        title: `Story ${i}`,
        status: "published",
        publishedAt: new Date(2026, 0, i + 1),
      });
    }
    const { items, nextCursor } = await listPublishedStories({ limit: 2 });
    expect(items).toHaveLength(2);
    expect(nextCursor).not.toBeNull();
    // Newest two by published_at DESC.
    expect(items.map((r) => r.externalId)).toEqual(["s-4", "s-3"]);
  });

  itDb(
    "cursor returns the page strictly after; pages do not overlap",
    async () => {
      for (let i = 0; i < 5; i++) {
        await makeStory({
          externalId: `s-${i}`,
          title: `Story ${i}`,
          status: "published",
          publishedAt: new Date(2026, 0, i + 1),
        });
      }
      const page1 = await listPublishedStories({ limit: 2 });
      const page2 = await listPublishedStories({
        limit: 2,
        cursor: page1.nextCursor!,
      });
      expect(page2.items.map((r) => r.externalId)).toEqual(["s-2", "s-1"]);
      const overlap = new Set([
        ...page1.items.map((r) => r.externalId),
        ...page2.items.map((r) => r.externalId),
      ]);
      expect(overlap.size).toBe(4);

      const page3 = await listPublishedStories({
        limit: 2,
        cursor: page2.nextCursor!,
      });
      expect(page3.items.map((r) => r.externalId)).toEqual(["s-0"]);
      expect(page3.nextCursor).toBeNull();
    },
  );

  itDb(
    "splits equal-published_at rows deterministically by id DESC",
    async () => {
      const sharedAt = new Date("2026-01-01T00:00:00Z");
      for (let i = 0; i < 4; i++) {
        await makeStory({
          externalId: `tie-${i}`,
          title: `Tied ${i}`,
          status: "published",
          publishedAt: sharedAt,
        });
      }
      const page1 = await listPublishedStories({ limit: 2 });
      const page2 = await listPublishedStories({
        limit: 2,
        cursor: page1.nextCursor!,
      });
      const seen = new Set([
        ...page1.items.map((r) => r.id),
        ...page2.items.map((r) => r.id),
      ]);
      expect(seen.size).toBe(4);
      // Each page is in id-DESC within its tier — verify no shared items.
      for (const it of page2.items) {
        expect(page1.items.find((p) => p.id === it.id)).toBeUndefined();
      }
    },
  );

  itDb("rejects a malformed cursor", async () => {
    await expect(
      listPublishedStories({ cursor: "not-a-cursor" }),
    ).rejects.toThrow(/malformed cursor/);
  });
});

describe("parseCursor / encodeCursor", () => {
  it("round-trips a valid (publishedAt, id) pair", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    const publishedAt = new Date("2026-04-30T12:34:56.789Z");
    const cursor = encodeCursor({ publishedAt, id });
    const parsed = parseCursor(cursor);
    expect(parsed?.id).toBe(id);
    expect(parsed?.publishedAt.toISOString()).toBe(publishedAt.toISOString());
  });

  it("returns null on missing separator", () => {
    expect(parseCursor("2026-01-01T00:00:00Z")).toBeNull();
  });

  it("returns null on bad uuid", () => {
    expect(parseCursor("2026-01-01T00:00:00Z__not-a-uuid")).toBeNull();
  });

  it("rejects ill-grouped uuid-shaped strings (length-only check is not enough)", () => {
    // 36 chars and only [0-9a-f-] but not in canonical 8-4-4-4-12 grouping.
    expect(
      parseCursor("2026-01-01T00:00:00Z__------------------------------------"),
    ).toBeNull();
    expect(
      parseCursor("2026-01-01T00:00:00Z__1111111111111111111111111111111111aa"),
    ).toBeNull();
  });

  it("returns null on bad date", () => {
    expect(
      parseCursor("not-a-date__11111111-1111-1111-1111-111111111111"),
    ).toBeNull();
  });
});

describe("primaryCategoryByStoryIds", () => {
  itDb(
    "returns the lowest-sortOrder Category for each Story (multi-category resolves deterministically)",
    async () => {
      const robo = await makeStory({
        externalId: "robo",
        title: "Robotics only",
        status: "published",
        publishedAt: new Date("2026-01-01"),
        categorySlugs: ["ai-in-robotics"],
      });
      // tech (sortOrder 10) and research (70) — tech wins.
      const both = await makeStory({
        externalId: "tech-research",
        title: "Tech and research",
        status: "published",
        publishedAt: new Date("2026-01-02"),
        categorySlugs: ["ai-research", "ai-in-tech"],
      });
      const map = await primaryCategoryByStoryIds([robo, both]);
      expect(map.get(robo)?.slug).toBe("ai-in-robotics");
      expect(map.get(both)?.slug).toBe("ai-in-tech");
    },
  );
});

describe("getPublishedStoryBySlug", () => {
  itDb("returns the row for a published story", async () => {
    await makeStory({
      externalId: "pub-only",
      title: "Pub only",
      status: "published",
      publishedAt: new Date("2026-01-01"),
    });
    const row = await getPublishedStoryBySlug("pub-only");
    expect(row?.externalId).toBe("pub-only");
  });

  itDb("returns null for a draft row", async () => {
    await makeStory({
      externalId: "draft-only",
      title: "Draft only",
      status: "draft",
    });
    expect(await getPublishedStoryBySlug("draft-only")).toBeNull();
  });

  itDb("returns null for a rejected row", async () => {
    await makeStory({
      externalId: "rejected-only",
      title: "Rejected only",
      status: "rejected",
    });
    expect(await getPublishedStoryBySlug("rejected-only")).toBeNull();
  });

  itDb("returns null when the slug does not exist", async () => {
    expect(await getPublishedStoryBySlug("does-not-exist")).toBeNull();
  });
});

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "./index";
import { listCategories, listPublishedStories } from "./queries";

const haveDb = Boolean(process.env.DATABASE_URL);
const itDb = haveDb ? it : it.skip;

async function makeStory(opts: {
  externalId: string;
  title: string;
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
    const cats = await db
      .select({ id: categories.id, slug: categories.slug })
      .from(categories);
    const idBySlug = new Map(cats.map((c) => [c.slug, c.id]));
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
  beforeEach(async () => {
    if (!haveDb) return;
    // Re-truncate to be safe; setup.ts also runs.
    const db = getDb();
    await db.delete(storyCategories);
    await db.delete(stories);
  });

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
    const rows = await listPublishedStories();
    expect(rows.map((r) => r.externalId)).toEqual(["pub-1"]);
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
      expect(robotics.map((r) => r.externalId).sort()).toEqual([
        "both",
        "robo-only",
      ]);

      const tech = await listPublishedStories({ category: "ai-in-tech" });
      expect(tech.map((r) => r.externalId).sort()).toEqual([
        "both",
        "tech-only",
      ]);

      const cooking = await listPublishedStories({
        category: "ai-in-cooking",
      });
      expect(cooking).toHaveLength(0);
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
    const rows = await listPublishedStories();
    expect(rows.map((r) => r.externalId)).toEqual(["new", "mid", "old"]);
  });

  itDb("respects limit", async () => {
    for (let i = 0; i < 5; i++) {
      await makeStory({
        externalId: `s-${i}`,
        title: `Story ${i}`,
        status: "published",
        publishedAt: new Date(2026, 0, i + 1),
      });
    }
    const rows = await listPublishedStories({ limit: 2 });
    expect(rows).toHaveLength(2);
  });
});

// Suppress an "unused import" warning when the DB tests are skipped.
void eq;

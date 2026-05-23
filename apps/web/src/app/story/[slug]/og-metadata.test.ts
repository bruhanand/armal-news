import { describe, expect, it } from "vitest";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "@armal/shared/db";

const haveDb = Boolean(process.env.DATABASE_URL);
const itDb = haveDb ? it : it.skip;

async function categoryIdMap(): Promise<Map<string, string>> {
  const rows = await getDb()
    .select({ id: categories.id, slug: categories.slug })
    .from(categories);
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function seedStory(opts: {
  externalId: string;
  title: string;
  shortSummary: string;
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
      shortSummary: opts.shortSummary,
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

describe("generateMetadata for /story/[slug]", () => {
  itDb("returns OG + Twitter metadata for a published Story", async () => {
    await seedStory({
      externalId: "og-pub",
      title: "Anthropic open-sources interpretability tools",
      shortSummary: "A toolkit for tracing model internals.",
      status: "published",
      publishedAt: new Date("2026-01-01"),
      categorySlugs: ["ai-research"],
    });

    const { generateMetadata } = await import("./page");
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "og-pub" }),
    });

    expect(meta.title).toBe("Anthropic open-sources interpretability tools");
    expect(meta.description).toBe("A toolkit for tracing model internals.");

    expect(meta.openGraph).toMatchObject({
      title: "Anthropic open-sources interpretability tools",
      description: "A toolkit for tracing model internals.",
      type: "article",
      url: "/story/og-pub",
    });

    const ogImages = meta.openGraph!.images as Array<{
      url: string;
      width: number;
      height: number;
    }>;
    expect(ogImages).toHaveLength(1);
    expect(ogImages![0]!.url).toBe("/story/og-pub/opengraph-image");
    expect(ogImages![0]!.width).toBe(1200);
    expect(ogImages![0]!.height).toBe(630);

    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Anthropic open-sources interpretability tools",
      description: "A toolkit for tracing model internals.",
    });
    const twImages = meta.twitter!.images as string[];
    expect(twImages![0]).toBe("/story/og-pub/opengraph-image");
  });

  itDb("returns empty metadata for a draft Story (not published)", async () => {
    await seedStory({
      externalId: "og-draft",
      title: "Draft story",
      shortSummary: "This is a draft.",
      status: "draft",
    });

    const { generateMetadata } = await import("./page");
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "og-draft" }),
    });

    expect(meta.title).toBeUndefined();
    expect(meta.openGraph).toBeUndefined();
    expect(meta.twitter).toBeUndefined();
  });

  itDb("returns empty metadata for a rejected Story", async () => {
    await seedStory({
      externalId: "og-rejected",
      title: "Rejected story",
      shortSummary: "This was rejected.",
      status: "rejected",
    });

    const { generateMetadata } = await import("./page");
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "og-rejected" }),
    });

    expect(meta.title).toBeUndefined();
    expect(meta.openGraph).toBeUndefined();
  });

  itDb("returns empty metadata for a non-existent slug", async () => {
    const { generateMetadata } = await import("./page");
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "does-not-exist" }),
    });

    expect(meta.title).toBeUndefined();
    expect(meta.openGraph).toBeUndefined();
  });

  itDb("og:image URL is per-slug", async () => {
    await seedStory({
      externalId: "slug-alpha",
      title: "Alpha",
      shortSummary: "Alpha summary",
      status: "published",
      publishedAt: new Date("2026-01-01"),
    });
    await seedStory({
      externalId: "slug-beta",
      title: "Beta",
      shortSummary: "Beta summary",
      status: "published",
      publishedAt: new Date("2026-01-02"),
    });

    const { generateMetadata } = await import("./page");
    const metaA = await generateMetadata({
      params: Promise.resolve({ slug: "slug-alpha" }),
    });
    const metaB = await generateMetadata({
      params: Promise.resolve({ slug: "slug-beta" }),
    });

    const imgA = (
      metaA.openGraph!.images as Array<{ url: string }>
    )[0]!.url;
    const imgB = (
      metaB.openGraph!.images as Array<{ url: string }>
    )[0]!.url;

    expect(imgA).toBe("/story/slug-alpha/opengraph-image");
    expect(imgB).toBe("/story/slug-beta/opengraph-image");
    expect(imgA).not.toBe(imgB);
  });
});

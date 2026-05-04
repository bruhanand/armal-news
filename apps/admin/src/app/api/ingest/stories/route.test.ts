import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/storage")>("@/lib/storage");
  return {
    ...actual,
    uploadStoryImage: vi.fn(),
  };
});

import { eq } from "drizzle-orm";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "@armal/shared/db";
import { uploadStoryImage } from "@/lib/storage";
import { POST } from "./route";

const uploadMock = vi.mocked(uploadStoryImage);

type StoryInput = {
  external_id: string;
  title: string;
  short_summary?: string;
  body_markdown?: string;
  image_url: string;
  source_link?: string;
  category_slugs?: string[];
  tags?: string[];
};

function makeStory(overrides: StoryInput) {
  return {
    short_summary: "A summary.",
    body_markdown: "# Body",
    source_link: "https://example.com/source",
    category_slugs: ["ai-in-robotics"],
    tags: [],
    ...overrides,
  };
}

function ingestRequest(body: unknown) {
  return new Request("http://localhost:3001/api/ingest/stories", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function imageResponse(contentType: string, status = 200) {
  return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
    status,
    headers: contentType ? { "content-type": contentType } : {},
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  uploadMock.mockReset();
  uploadMock.mockImplementation(async ({ externalId, contentType }) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(contentType)) {
      throw new Error(`unsupported image content-type: ${contentType}`);
    }
    return {
      publicUrl: `https://test.supabase.co/storage/v1/object/public/story-images/${externalId}.jpg`,
    };
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/ingest/stories — image pipeline", () => {
  it("uploads each Story's image and rewrites image_url to the CDN URL", async () => {
    fetchMock.mockImplementation(async () => imageResponse("image/jpeg"));

    const batch = {
      stories: [
        makeStory({
          external_id: "ext-1",
          title: "First story",
          image_url: "https://upstream.example/a.jpg",
        }),
        makeStory({
          external_id: "ext-2",
          title: "Second story",
          image_url: "https://upstream.example/b.jpg",
        }),
        makeStory({
          external_id: "ext-3",
          title: "Third story",
          image_url: "https://upstream.example/c.jpg",
        }),
      ],
    };

    const res = await POST(ingestRequest(batch));
    const json = (await res.json()) as {
      ok: boolean;
      results: Array<{ external_id: string; action: string }>;
      errors: Array<{ index: number; message: string }>;
    };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.errors).toEqual([]);
    expect(json.results).toHaveLength(3);
    expect(uploadMock).toHaveBeenCalledTimes(3);

    const db = getDb();
    const rows = await db.select().from(stories);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.imageUrl).toMatch(
        /^https:\/\/test\.supabase\.co\/storage\/v1\/object\/public\/story-images\/ext-\d\.jpg$/,
      );
      expect(row.imageUrl).not.toContain("upstream.example");
    }
  });

  it("isolates a 404 image fetch to the failing Story", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/missing.jpg")) {
        return imageResponse("image/jpeg", 404);
      }
      return imageResponse("image/jpeg");
    });

    const batch = {
      stories: [
        makeStory({
          external_id: "ok-1",
          title: "Ok one",
          image_url: "https://upstream.example/a.jpg",
        }),
        makeStory({
          external_id: "broken",
          title: "Broken one",
          image_url: "https://upstream.example/missing.jpg",
        }),
        makeStory({
          external_id: "ok-2",
          title: "Ok two",
          image_url: "https://upstream.example/b.jpg",
        }),
      ],
    };

    const res = await POST(ingestRequest(batch));
    const json = (await res.json()) as {
      ok: boolean;
      results: Array<{ external_id: string }>;
      errors: Array<{ index: number; message: string }>;
    };

    expect(json.ok).toBe(false);
    expect(json.results.map((r) => r.external_id).sort()).toEqual([
      "ok-1",
      "ok-2",
    ]);
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0]!.index).toBe(1);
    expect(json.errors[0]!.message).toContain("broken");
    expect(json.errors[0]!.message).toMatch(/404/);

    const db = getDb();
    const rows = await db.select().from(stories);
    expect(rows.map((r) => r.externalId).sort()).toEqual(["ok-1", "ok-2"]);
  });

  it("isolates an unsupported content-type to the failing Story", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/doc.pdf")) {
        return imageResponse("application/pdf");
      }
      return imageResponse("image/png");
    });

    const batch = {
      stories: [
        makeStory({
          external_id: "img-ok",
          title: "Image one",
          image_url: "https://upstream.example/a.png",
        }),
        makeStory({
          external_id: "pdf-bad",
          title: "PDF masquerading",
          image_url: "https://upstream.example/doc.pdf",
        }),
      ],
    };

    const res = await POST(ingestRequest(batch));
    const json = (await res.json()) as {
      ok: boolean;
      results: Array<{ external_id: string }>;
      errors: Array<{ index: number; message: string }>;
    };

    expect(json.results.map((r) => r.external_id)).toEqual(["img-ok"]);
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0]!.message).toContain("pdf-bad");
    expect(json.errors[0]!.message).toMatch(/content-type/);
    expect(json.errors[0]!.message).toContain("application/pdf");
  });

  it("is idempotent on external_id and re-uploads with upsert on every run", async () => {
    fetchMock.mockImplementation(async () => imageResponse("image/jpeg"));

    const batch = {
      stories: [
        makeStory({
          external_id: "ext-rerun-1",
          title: "Rerun A",
          image_url: "https://upstream.example/a.jpg",
        }),
        makeStory({
          external_id: "ext-rerun-2",
          title: "Rerun B",
          image_url: "https://upstream.example/b.jpg",
        }),
      ],
    };

    const first = await POST(ingestRequest(batch));
    expect(first.status).toBe(200);

    const db = getDb();
    const after1 = await db.select().from(stories);
    expect(after1).toHaveLength(2);
    const slugsAfter1 = after1.map((r) => r.slug).sort();

    const second = await POST(ingestRequest(batch));
    expect(second.status).toBe(200);
    const json2 = (await second.json()) as {
      results: Array<{ action: string }>;
    };
    expect(json2.results.every((r) => r.action === "updated")).toBe(true);

    const after2 = await db.select().from(stories);
    expect(after2).toHaveLength(2);
    expect(after2.map((r) => r.slug).sort()).toEqual(slugsAfter1);

    expect(uploadMock).toHaveBeenCalledTimes(4);
    const externalIdsUploaded = uploadMock.mock.calls.map(
      (c) => c[0].externalId,
    );
    expect(externalIdsUploaded.filter((id) => id === "ext-rerun-1")).toHaveLength(
      2,
    );
    expect(externalIdsUploaded.filter((id) => id === "ext-rerun-2")).toHaveLength(
      2,
    );
  });

  it("rejects an invalid batch at zod and writes nothing", async () => {
    const batch = {
      stories: [
        {
          external_id: "bad",
          title: "",
          short_summary: "x",
          body_markdown: "x",
          image_url: "https://upstream.example/a.jpg",
          source_link: "https://upstream.example",
          category_slugs: ["ai-in-robotics"],
          tags: [],
        },
      ],
    };

    const res = await POST(ingestRequest(batch));
    expect(res.status).toBe(400);

    const db = getDb();
    const rows = await db.select().from(stories);
    expect(rows).toHaveLength(0);
    expect(uploadMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/ingest/stories — category persistence", () => {
  beforeEach(() => {
    fetchMock.mockImplementation(async () => imageResponse("image/jpeg"));
  });

  it("writes one story_categories row per category on insert", async () => {
    const batch = {
      stories: [
        makeStory({
          external_id: "ext-cat-1",
          title: "Two-cat story",
          image_url: "https://upstream.example/a.jpg",
          category_slugs: ["ai-in-robotics", "ai-in-tech"],
        }),
      ],
    };

    const res = await POST(ingestRequest(batch));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);

    const db = getDb();
    const [row] = await db
      .select()
      .from(stories)
      .where(eq(stories.externalId, "ext-cat-1"));
    expect(row).toBeDefined();

    const joins = await db
      .select({ slug: categories.slug })
      .from(storyCategories)
      .innerJoin(
        categories,
        eq(storyCategories.categoryId, categories.id),
      )
      .where(eq(storyCategories.storyId, row!.id));
    expect(joins.map((j) => j.slug).sort()).toEqual([
      "ai-in-robotics",
      "ai-in-tech",
    ]);
  });

  it("reconciles join rows on update (delete-then-insert)", async () => {
    const first = {
      stories: [
        makeStory({
          external_id: "ext-cat-rec",
          title: "Reconciling story",
          image_url: "https://upstream.example/a.jpg",
          category_slugs: ["ai-in-robotics", "ai-in-tech"],
        }),
      ],
    };
    await POST(ingestRequest(first));

    const second = {
      stories: [
        makeStory({
          external_id: "ext-cat-rec",
          title: "Reconciling story",
          image_url: "https://upstream.example/a.jpg",
          category_slugs: ["ai-in-finance"],
        }),
      ],
    };
    const res2 = await POST(ingestRequest(second));
    expect(res2.status).toBe(200);
    const json2 = (await res2.json()) as {
      results: Array<{ action: string }>;
    };
    expect(json2.results[0]!.action).toBe("updated");

    const db = getDb();
    const [row] = await db
      .select()
      .from(stories)
      .where(eq(stories.externalId, "ext-cat-rec"));
    const joins = await db
      .select({ slug: categories.slug })
      .from(storyCategories)
      .innerJoin(
        categories,
        eq(storyCategories.categoryId, categories.id),
      )
      .where(eq(storyCategories.storyId, row!.id));
    expect(joins.map((j) => j.slug)).toEqual(["ai-in-finance"]);
  });

  it("rejects a Story with an unseeded category slug; writes no story or join rows", async () => {
    const batch = {
      stories: [
        makeStory({
          external_id: "ext-bad-slug",
          title: "Bad-slug story",
          image_url: "https://upstream.example/a.jpg",
          category_slugs: ["ai-in-spaceflight"],
        }),
      ],
    };

    const res = await POST(ingestRequest(batch));
    expect(res.status).toBe(400);

    const db = getDb();
    const storyRows = await db
      .select()
      .from(stories)
      .where(eq(stories.externalId, "ext-bad-slug"));
    expect(storyRows).toHaveLength(0);

    const allJoins = await db.select().from(storyCategories);
    expect(allJoins).toHaveLength(0);
  });

  it("rejects a duplicate category_slugs entry at validation, not via DB error", async () => {
    const batch = {
      stories: [
        makeStory({
          external_id: "ext-dup-slug",
          title: "Duplicate-slug story",
          image_url: "https://upstream.example/a.jpg",
          category_slugs: ["ai-in-tech", "ai-in-tech"],
        }),
      ],
    };

    const res = await POST(ingestRequest(batch));
    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      ok: boolean;
      errors: Array<{ index: number; message: string }>;
    };
    expect(json.ok).toBe(false);
    const issue = json.errors.find((e) => e.index === 0);
    expect(issue).toBeDefined();
    expect(issue!.message).toMatch(/unique/);
    expect(issue!.message).not.toMatch(/duplicate key|story_categories_pkey/i);

    const db = getDb();
    const rows = await db.select().from(stories);
    expect(rows).toHaveLength(0);
    const allJoins = await db.select().from(storyCategories);
    expect(allJoins).toHaveLength(0);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("persists the validated tags array on insert", async () => {
    const batch = {
      stories: [
        makeStory({
          external_id: "ext-tags-insert",
          title: "Tagged story",
          image_url: "https://upstream.example/a.jpg",
          tags: ["llms", "safety"],
        }),
      ],
    };

    const res = await POST(ingestRequest(batch));
    expect(res.status).toBe(200);

    const db = getDb();
    const [row] = await db
      .select()
      .from(stories)
      .where(eq(stories.externalId, "ext-tags-insert"));
    expect(row?.tags).toEqual(["llms", "safety"]);
  });

  it("reconciles tags on update (replaces, does not merge)", async () => {
    const first = {
      stories: [
        makeStory({
          external_id: "ext-tags-rec",
          title: "Tag-reconciling story",
          image_url: "https://upstream.example/a.jpg",
          tags: ["llms", "safety"],
        }),
      ],
    };
    await POST(ingestRequest(first));

    const second = {
      stories: [
        makeStory({
          external_id: "ext-tags-rec",
          title: "Tag-reconciling story",
          image_url: "https://upstream.example/a.jpg",
          tags: ["robotics"],
        }),
      ],
    };
    const res = await POST(ingestRequest(second));
    expect(res.status).toBe(200);

    const db = getDb();
    const [row] = await db
      .select()
      .from(stories)
      .where(eq(stories.externalId, "ext-tags-rec"));
    expect(row?.tags).toEqual(["robotics"]);
  });

  it("isolates a per-Story bad slug to the failing index in a multi-Story batch", async () => {
    // The whole batch is rejected at zod (slice 0003 contract — even one
    // bad Story rejects the batch), so no rows write. Verify the per-index
    // error path identifies the bad Story.
    const batch = {
      stories: [
        makeStory({
          external_id: "ext-bad-1",
          title: "Bad slug",
          image_url: "https://upstream.example/a.jpg",
          category_slugs: ["nope-not-real"],
        }),
        makeStory({
          external_id: "ext-good-2",
          title: "Good story",
          image_url: "https://upstream.example/b.jpg",
          category_slugs: ["ai-in-tech"],
        }),
      ],
    };

    const res = await POST(ingestRequest(batch));
    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      ok: boolean;
      errors: Array<{ index: number; message: string }>;
    };
    expect(json.ok).toBe(false);
    const indices = json.errors.map((e) => e.index);
    expect(indices).toContain(0);
    expect(indices).not.toContain(1);

    const db = getDb();
    const rows = await db.select().from(stories);
    expect(rows).toHaveLength(0);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({
  deleteStoryImageByUrl: vi.fn(async () => undefined),
}));

import { eq } from "drizzle-orm";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "@armal/shared/db";
import { POST as publish } from "./[id]/publish/route";
import { POST as reject } from "./[id]/reject/route";
import { POST as unpublish } from "./[id]/unpublish/route";
import { POST as restore } from "./[id]/restore/route";
import { POST as deleteStory } from "./[id]/delete/route";
import { PATCH as patchStory } from "./[id]/route";
import { deleteStoryImageByUrl } from "@/lib/storage";

const deleteImageMock = vi.mocked(deleteStoryImageByUrl);

async function seedStory(opts: {
  externalId: string;
  status: "draft" | "published" | "rejected";
  publishedAt?: Date;
  rejectReason?: string;
  categorySlugs?: string[];
}) {
  const db = getDb();
  const [row] = await db
    .insert(stories)
    .values({
      externalId: opts.externalId,
      slug: opts.externalId,
      title: `Story ${opts.externalId}`,
      shortSummary: "summary",
      bodyMarkdown: "<p>body</p>",
      imageUrl: `https://test.supabase.co/storage/v1/object/public/story-images/${opts.externalId}.jpg`,
      sourceLink: `https://example.com/${opts.externalId}`,
      status: opts.status,
      publishedAt: opts.publishedAt ?? null,
      rejectReason: opts.rejectReason ?? null,
    })
    .returning();
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
  return row!;
}

async function fetchStory(id: string) {
  const [row] = await getDb()
    .select()
    .from(stories)
    .where(eq(stories.id, id))
    .limit(1);
  return row;
}

function jsonReq(body?: unknown) {
  return new Request("http://localhost/", {
    method: "POST",
    headers: body !== undefined ? { "content-type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : null,
  });
}

function patchReq(body: unknown) {
  return new Request("http://localhost/", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  deleteImageMock.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/stories/[id]/publish", () => {
  it("stamps publishedAt on a draft", async () => {
    const row = await seedStory({ externalId: "pub-1", status: "draft" });
    const res = await publish(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(200);
    const fresh = await fetchStory(row.id);
    expect(fresh?.status).toBe("published");
    expect(fresh?.publishedAt).toBeTruthy();
  });

  it("is a no-op on an already-published story", async () => {
    const pubAt = new Date("2026-01-15T00:00:00Z");
    const row = await seedStory({
      externalId: "pub-2",
      status: "published",
      publishedAt: pubAt,
    });
    const res = await publish(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(200);
    const fresh = await fetchStory(row.id);
    // publishedAt unchanged — confirms we did not re-stamp.
    expect(fresh?.publishedAt?.toISOString()).toBe(pubAt.toISOString());
  });

  it("rejects publishing a rejected story (illegal transition)", async () => {
    const row = await seedStory({ externalId: "pub-3", status: "rejected" });
    const res = await publish(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await publish(jsonReq(), {
      params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/admin/stories/[id]/reject", () => {
  it("flips a draft to rejected and persists reason", async () => {
    const row = await seedStory({ externalId: "rej-1", status: "draft" });
    const res = await reject(jsonReq({ reason: "Unverified claim" }), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(200);
    const fresh = await fetchStory(row.id);
    expect(fresh?.status).toBe("rejected");
    expect(fresh?.rejectReason).toBe("Unverified claim");
  });

  it("flips with no reason (rejectReason stays null)", async () => {
    const row = await seedStory({ externalId: "rej-2", status: "draft" });
    const res = await reject(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(200);
    const fresh = await fetchStory(row.id);
    expect(fresh?.status).toBe("rejected");
    expect(fresh?.rejectReason).toBeNull();
  });

  it("400s when called on a published story", async () => {
    const row = await seedStory({
      externalId: "rej-3",
      status: "published",
      publishedAt: new Date(),
    });
    const res = await reject(jsonReq({ reason: "no" }), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/stories/[id]/unpublish", () => {
  it("flips published → draft and clears publishedAt", async () => {
    const row = await seedStory({
      externalId: "unp-1",
      status: "published",
      publishedAt: new Date("2026-01-01"),
    });
    const res = await unpublish(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(200);
    const fresh = await fetchStory(row.id);
    expect(fresh?.status).toBe("draft");
    expect(fresh?.publishedAt).toBeNull();
  });

  it("400s when called on a draft (illegal: draft → draft)", async () => {
    const row = await seedStory({ externalId: "unp-2", status: "draft" });
    const res = await unpublish(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/stories/[id]/restore", () => {
  it("flips rejected → draft and clears rejectReason", async () => {
    const row = await seedStory({
      externalId: "res-1",
      status: "rejected",
      rejectReason: "Out of scope",
    });
    const res = await restore(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(200);
    const fresh = await fetchStory(row.id);
    expect(fresh?.status).toBe("draft");
    expect(fresh?.rejectReason).toBeNull();
  });

  it("400s when called on a draft", async () => {
    const row = await seedStory({ externalId: "res-2", status: "draft" });
    const res = await restore(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/stories/[id]/delete", () => {
  it("hard-deletes a rejected row and removes the Storage object", async () => {
    const row = await seedStory({
      externalId: "del-1",
      status: "rejected",
      categorySlugs: ["ai-in-tech"],
    });
    const res = await deleteStory(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(200);
    expect(await fetchStory(row.id)).toBeUndefined();
    expect(deleteImageMock).toHaveBeenCalledWith(row.imageUrl);
  });

  it("refuses to delete a draft (Delete is only allowed on rejected)", async () => {
    const row = await seedStory({ externalId: "del-2", status: "draft" });
    const res = await deleteStory(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(400);
    expect(await fetchStory(row.id)).toBeDefined();
    expect(deleteImageMock).not.toHaveBeenCalled();
  });

  it("refuses to delete a published row", async () => {
    const row = await seedStory({
      externalId: "del-3",
      status: "published",
      publishedAt: new Date(),
    });
    const res = await deleteStory(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 200 even when Storage delete throws — row delete is the source of truth", async () => {
    deleteImageMock.mockRejectedValueOnce(new Error("storage 500"));
    const row = await seedStory({ externalId: "del-4", status: "rejected" });
    const res = await deleteStory(jsonReq(), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(200);
    expect(await fetchStory(row.id)).toBeUndefined();
  });
});

describe("PATCH /api/admin/stories/[id]", () => {
  it("edits title + summary + body on a draft", async () => {
    const row = await seedStory({ externalId: "ed-1", status: "draft" });
    const res = await patchStory(
      patchReq({
        title: "New title",
        short_summary: "New summary",
        body_markdown: "# Heading\n\nNew body",
      }),
      { params: Promise.resolve({ id: row.id }) },
    );
    expect(res.status).toBe(200);
    const fresh = await fetchStory(row.id);
    expect(fresh?.title).toBe("New title");
    expect(fresh?.shortSummary).toBe("New summary");
    // body_markdown is sanitized HTML at write time (ADR 0004 § C / § E).
    expect(fresh?.bodyMarkdown).toContain("<h2>Heading</h2>");
    expect(fresh?.bodyMarkdown).toContain("New body");
  });

  it("edits a published row in place without touching publishedAt or status", async () => {
    const pubAt = new Date("2026-01-01T00:00:00Z");
    const row = await seedStory({
      externalId: "ed-2",
      status: "published",
      publishedAt: pubAt,
    });
    const res = await patchStory(
      patchReq({ title: "Revised live title" }),
      { params: Promise.resolve({ id: row.id }) },
    );
    expect(res.status).toBe(200);
    const fresh = await fetchStory(row.id);
    expect(fresh?.title).toBe("Revised live title");
    expect(fresh?.status).toBe("published");
    expect(fresh?.publishedAt?.toISOString()).toBe(pubAt.toISOString());
  });

  it("ignores slug, external_id, published_at, status on the body", async () => {
    const pubAt = new Date("2026-01-01T00:00:00Z");
    const row = await seedStory({
      externalId: "ed-3",
      status: "published",
      publishedAt: pubAt,
    });
    const res = await patchStory(
      patchReq({
        title: "Real edit",
        slug: "should-be-ignored",
        external_id: "ignored-too",
        published_at: "2030-01-01T00:00:00Z",
        status: "rejected",
      }),
      { params: Promise.resolve({ id: row.id }) },
    );
    expect(res.status).toBe(200);
    const fresh = await fetchStory(row.id);
    expect(fresh?.title).toBe("Real edit");
    expect(fresh?.slug).toBe("ed-3");
    expect(fresh?.externalId).toBe("ed-3");
    expect(fresh?.status).toBe("published");
    expect(fresh?.publishedAt?.toISOString()).toBe(pubAt.toISOString());
  });

  it("reconciles category_slugs", async () => {
    const row = await seedStory({
      externalId: "ed-4",
      status: "draft",
      categorySlugs: ["ai-in-tech"],
    });
    const res = await patchStory(
      patchReq({ category_slugs: ["ai-in-finance", "ai-in-robotics"] }),
      { params: Promise.resolve({ id: row.id }) },
    );
    expect(res.status).toBe(200);
    const rows = await getDb()
      .select({ slug: categories.slug })
      .from(storyCategories)
      .innerJoin(categories, eq(storyCategories.categoryId, categories.id))
      .where(eq(storyCategories.storyId, row.id));
    expect(rows.map((r) => r.slug).sort()).toEqual([
      "ai-in-finance",
      "ai-in-robotics",
    ]);
  });

  it("400s on a rejected row (only draft/published editable)", async () => {
    const row = await seedStory({ externalId: "ed-5", status: "rejected" });
    const res = await patchStory(patchReq({ title: "no" }), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(400);
  });
});

import { describe, expect, it, vi } from "vitest";
import { ApiError, buildFeedUrl, createApiClient } from "./client";

const BASE = "https://example.test";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("buildFeedUrl", () => {
  it("omits query params when not provided", () => {
    expect(buildFeedUrl(BASE)).toBe(`${BASE}/api/feed`);
  });

  it("encodes category, cursor, limit", () => {
    const url = buildFeedUrl(BASE, {
      category: "ai-in-tech",
      cursor: "2026-05-01__abc",
      limit: 20,
    });
    expect(url).toBe(
      `${BASE}/api/feed?category=ai-in-tech&cursor=2026-05-01__abc&limit=20`,
    );
  });
});

describe("createApiClient", () => {
  it("getFeed reads { items, nextCursor }", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ items: [{ id: "a" }], nextCursor: null }),
    );
    const client = createApiClient(BASE, fetchImpl);
    const page = await client.getFeed();
    expect(page).toEqual({ items: [{ id: "a" }], nextCursor: null });
    expect(fetchImpl).toHaveBeenCalledWith(`${BASE}/api/feed`);
  });

  it("getStoryBySlug unwraps { story }", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ story: { id: "s1", slug: "hello" } }),
    );
    const client = createApiClient(BASE, fetchImpl);
    const story = await client.getStoryBySlug("hello world");
    expect(story).toEqual({ id: "s1", slug: "hello" });
    expect(fetchImpl).toHaveBeenCalledWith(
      `${BASE}/api/story/hello%20world`,
    );
  });

  it("getCategories unwraps { categories }", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ categories: [{ slug: "ai-in-tech", name: "AI in Tech" }] }),
    );
    const client = createApiClient(BASE, fetchImpl);
    const cats = await client.getCategories();
    expect(cats).toEqual([{ slug: "ai-in-tech", name: "AI in Tech" }]);
  });

  it("throws ApiError with status + server error message on non-2xx", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ error: "unknown category slug: bogus" }, 400),
    );
    const client = createApiClient(BASE, fetchImpl);
    await expect(
      client.getFeed({ category: "bogus" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: expect.stringContaining("unknown category slug"),
    });
  });

  it("preserves the ApiError type", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    const client = createApiClient(BASE, fetchImpl);
    await expect(client.getStoryBySlug("x")).rejects.toBeInstanceOf(ApiError);
  });
});

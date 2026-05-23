import { describe, expect, it } from "vitest";
import {
  IngestBatch,
  IngestStoryV1,
  statusTransition,
  STORY_STATUSES,
  type StoryStatus,
} from "./story";

const validStory = {
  external_id: "openclaw-2026-05-02-001",
  title: "1X ships Neo to first homes",
  short_summary: "Norwegian robotics startup delivered its first units.",
  body_markdown: "# 1X ships Neo\n\nThe first units are out.",
  image_url: "https://example.com/neo.jpg",
  source_link: "https://www.1x.tech/",
  tags: ["humanoid-robot", "1x"],
  category_slugs: ["ai-in-robotics"],
};

describe("IngestStoryV1", () => {
  it("accepts a valid full payload", () => {
    expect(IngestStoryV1.parse(validStory)).toMatchObject({
      external_id: "openclaw-2026-05-02-001",
      tags: ["humanoid-robot", "1x"],
    });
  });

  it("defaults tags to [] when omitted", () => {
    const { tags: _omit, ...rest } = validStory;
    void _omit;
    const parsed = IngestStoryV1.parse(rest);
    expect(parsed.tags).toEqual([]);
  });

  it("rejects missing required fields", () => {
    const { title: _t, ...withoutTitle } = validStory;
    void _t;
    expect(IngestStoryV1.safeParse(withoutTitle).success).toBe(false);
  });

  it("rejects empty string for required fields", () => {
    expect(
      IngestStoryV1.safeParse({ ...validStory, title: "" }).success,
    ).toBe(false);
    expect(
      IngestStoryV1.safeParse({ ...validStory, external_id: "" }).success,
    ).toBe(false);
    expect(
      IngestStoryV1.safeParse({ ...validStory, short_summary: "" }).success,
    ).toBe(false);
    expect(
      IngestStoryV1.safeParse({ ...validStory, body_markdown: "" }).success,
    ).toBe(false);
  });

  it("rejects a non-URL image_url", () => {
    expect(
      IngestStoryV1.safeParse({ ...validStory, image_url: "not-a-url" }).success,
    ).toBe(false);
  });

  it("rejects a source_link that is not an http(s) URL", () => {
    expect(
      IngestStoryV1.safeParse({ ...validStory, source_link: "ftp://x" }).success,
    ).toBe(false);
    expect(
      IngestStoryV1.safeParse({ ...validStory, source_link: "nope" }).success,
    ).toBe(false);
  });

  it("rejects a javascript: scheme in source_link", () => {
    expect(
      IngestStoryV1.safeParse({
        ...validStory,
        source_link: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("rejects a javascript: scheme in image_url", () => {
    expect(
      IngestStoryV1.safeParse({
        ...validStory,
        image_url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown key on a Story (strict)", () => {
    expect(
      IngestStoryV1.safeParse({ ...validStory, surprise: 1 }).success,
    ).toBe(false);
  });

  it("rejects empty category_slugs array", () => {
    expect(
      IngestStoryV1.safeParse({ ...validStory, category_slugs: [] }).success,
    ).toBe(false);
  });

  it("rejects an unseeded category slug", () => {
    const result = IngestStoryV1.safeParse({
      ...validStory,
      category_slugs: ["ai-in-spaceflight"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const slugIssue = result.error.issues.find(
        (i) => i.path[0] === "category_slugs",
      );
      expect(slugIssue).toBeDefined();
    }
  });

  it("rejects a mix of seeded + unseeded slugs and pinpoints the bad index", () => {
    const result = IngestStoryV1.safeParse({
      ...validStory,
      category_slugs: ["ai-in-tech", "not-a-real-category", "ai-in-robotics"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const badIssue = result.error.issues.find(
        (i) => i.path[0] === "category_slugs" && i.path[1] === 1,
      );
      expect(badIssue).toBeDefined();
    }
  });

  it("rejects a duplicated category slug", () => {
    const result = IngestStoryV1.safeParse({
      ...validStory,
      category_slugs: ["ai-in-tech", "ai-in-tech"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const dupIssue = result.error.issues.find(
        (i) => i.path[0] === "category_slugs",
      );
      expect(dupIssue).toBeDefined();
      expect(dupIssue!.message).toMatch(/unique/);
    }
  });

  it("accepts every seeded slug", () => {
    const all = [
      "ai-in-tech",
      "ai-in-finance",
      "ai-in-healthcare",
      "ai-in-robotics",
      "ai-in-cooking",
      "ai-in-education",
      "ai-research",
      "ai-tools",
      "ai-policy-safety",
    ];
    const result = IngestStoryV1.safeParse({
      ...validStory,
      category_slugs: all,
    });
    expect(result.success).toBe(true);
  });
});

describe("statusTransition", () => {
  const NOW = new Date("2026-05-23T12:00:00.000Z");

  // Full 3×3 matrix coverage. Legal cells have explicit assertions; the rest
  // (the seven illegal cells) are swept by the table below.
  const ILLEGAL: Array<[StoryStatus, StoryStatus]> = [
    ["draft", "draft"],
    ["published", "rejected"],
    ["rejected", "published"],
    ["rejected", "rejected"],
  ];

  it("draft → published stamps publishedAt", () => {
    const r = statusTransition({ from: "draft", to: "published", now: NOW });
    expect(r).toEqual({
      ok: true,
      patch: { status: "published", publishedAt: NOW },
    });
  });

  it("draft → rejected stores reason when provided", () => {
    const r = statusTransition({
      from: "draft",
      to: "rejected",
      reason: "Unverified claim",
      now: NOW,
    });
    expect(r).toEqual({
      ok: true,
      patch: { status: "rejected", rejectReason: "Unverified claim" },
    });
  });

  it("draft → rejected stores null when reason omitted", () => {
    const r = statusTransition({ from: "draft", to: "rejected", now: NOW });
    expect(r).toEqual({
      ok: true,
      patch: { status: "rejected", rejectReason: null },
    });
  });

  it("draft → rejected stores null when reason is the empty string", () => {
    const r = statusTransition({
      from: "draft",
      to: "rejected",
      reason: "",
      now: NOW,
    });
    expect(r).toEqual({
      ok: true,
      patch: { status: "rejected", rejectReason: null },
    });
  });

  it("published → published is allowed with no side-effect", () => {
    const r = statusTransition({
      from: "published",
      to: "published",
      now: NOW,
    });
    expect(r).toEqual({ ok: true, patch: { status: "published" } });
  });

  it("published → draft (un-publish) clears publishedAt", () => {
    const r = statusTransition({ from: "published", to: "draft", now: NOW });
    expect(r).toEqual({
      ok: true,
      patch: { status: "draft", publishedAt: null },
    });
  });

  it("rejected → draft (restore) clears rejectReason", () => {
    const r = statusTransition({ from: "rejected", to: "draft", now: NOW });
    expect(r).toEqual({
      ok: true,
      patch: { status: "draft", rejectReason: null },
    });
  });

  it.each(ILLEGAL)(
    "rejects illegal transition %s → %s",
    (from, to) => {
      const r = statusTransition({ from, to });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toMatch(/illegal status transition/);
        expect(r.error).toContain(from);
        expect(r.error).toContain(to);
      }
    },
  );

  it("legal cells cover every reachable state", () => {
    // Sanity: the matrix is exhaustive — every (from, to) is either in the
    // legal set above or in ILLEGAL. Catches a future enum addition that
    // forgets to update this test.
    const LEGAL = new Set([
      "draft→published",
      "draft→rejected",
      "published→published",
      "published→draft",
      "rejected→draft",
    ]);
    for (const from of STORY_STATUSES) {
      for (const to of STORY_STATUSES) {
        const key = `${from}→${to}`;
        const inIllegal = ILLEGAL.some(([f, t]) => f === from && t === to);
        if (!LEGAL.has(key) && !inIllegal) {
          throw new Error(`uncovered transition: ${key}`);
        }
      }
    }
  });
});

describe("IngestBatch", () => {
  it("accepts a non-empty batch", () => {
    const parsed = IngestBatch.parse({ stories: [validStory, validStory] });
    expect(parsed.stories).toHaveLength(2);
  });

  it("rejects an empty batch", () => {
    expect(IngestBatch.safeParse({ stories: [] }).success).toBe(false);
  });

  it("rejects a batch where any single Story is invalid", () => {
    const result = IngestBatch.safeParse({
      stories: [validStory, { ...validStory, title: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a batch with an unknown key (strict)", () => {
    expect(
      IngestBatch.safeParse({ stories: [validStory], surprise: 1 }).success,
    ).toBe(false);
  });
});

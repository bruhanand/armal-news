import { describe, expect, it } from "vitest";
import { IngestBatch, IngestStoryV1 } from "./story";

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

  it("rejects a non-URL source_link", () => {
    expect(
      IngestStoryV1.safeParse({ ...validStory, source_link: "ftp://x" }).success,
    ).toBe(true);
    expect(
      IngestStoryV1.safeParse({ ...validStory, source_link: "nope" }).success,
    ).toBe(false);
  });

  it("rejects empty category_slugs array", () => {
    expect(
      IngestStoryV1.safeParse({ ...validStory, category_slugs: [] }).success,
    ).toBe(false);
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
});

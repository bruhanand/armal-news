import { z } from "zod";
import { CATEGORY_SLUGS } from "../constants/categories";

// Both URL fields are attacker-influenceable (OpenClaw scrapes arbitrary
// upstream pages). z.string().url() alone accepts javascript:/data:/ftp:, which
// would be a stored-XSS sink on render and a scheme bypass on the image fetch —
// so refine down to http(s) only.
const httpUrl = z
  .string()
  .url()
  .refine(
    (value) => {
      try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "must be an http(s) URL" },
  );

export const IngestStoryV1 = z
  .object({
    external_id: z.string().min(1),
    title: z.string().min(1).max(300),
    short_summary: z.string().min(1),
    body_markdown: z.string().min(1),
    image_url: httpUrl,
    source_link: httpUrl,
    tags: z.array(z.string()).default([]),
    category_slugs: z
      .array(z.enum(CATEGORY_SLUGS))
      .min(1)
      .refine((arr) => new Set(arr).size === arr.length, {
        message: "category_slugs must be unique",
      }),
  })
  .strict();

export type IngestStoryV1 = z.infer<typeof IngestStoryV1>;

export const IngestBatch = z
  .object({
    stories: z.array(IngestStoryV1).min(1),
  })
  .strict();

export type IngestBatch = z.infer<typeof IngestBatch>;

import { z } from "zod";
import { CATEGORY_SLUGS } from "../constants/categories";

export const IngestStoryV1 = z.object({
  external_id: z.string().min(1),
  title: z.string().min(1).max(300),
  short_summary: z.string().min(1),
  body_markdown: z.string().min(1),
  image_url: z.string().url(),
  source_link: z.string().url(),
  tags: z.array(z.string()).default([]),
  category_slugs: z.array(z.enum(CATEGORY_SLUGS)).min(1),
});

export type IngestStoryV1 = z.infer<typeof IngestStoryV1>;

export const IngestBatch = z.object({
  stories: z.array(IngestStoryV1).min(1),
});

export type IngestBatch = z.infer<typeof IngestBatch>;

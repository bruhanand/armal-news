import { z } from "zod";
import { CATEGORY_SLUGS } from "../constants/categories";
import { isHttpUrl } from "../lib/url";

// z.string().url() accepts javascript:/data:/ftp:; both URL fields are
// attacker-influenceable, so refine down to http(s) only.
const httpUrl = z
  .string()
  .url()
  .refine(isHttpUrl, { message: "must be an http(s) URL" });

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

// Story lifecycle states. Mirrors the Postgres enum in db/schema.ts.
export const STORY_STATUSES = ["draft", "published", "rejected"] as const;
export type StoryStatus = (typeof STORY_STATUSES)[number];

// The patch a successful transition emits — only the columns that should
// change as a side-effect. `null` means "clear the column", `undefined`
// means "leave untouched" (used for published → published in-place edits,
// which carry no status-driven side-effect).
export type StatusTransitionPatch = {
  status: StoryStatus;
  publishedAt?: Date | null;
  rejectReason?: string | null;
};

export type StatusTransitionResult =
  | { ok: true; patch: StatusTransitionPatch }
  | { ok: false; error: string };

// Pure function: maps (from, to, optional reason) to either the patch the
// caller should apply or an error message for an illegal transition.
// Matrix (ADR 0004 § B):
//   draft → published  ✅ stamp publishedAt
//   draft → rejected   ✅ stamp rejectReason (null if no reason given)
//   published → published ✅ no side-effect (in-place edit)
//   published → draft  ✅ clear publishedAt (Un-publish)
//   rejected → draft   ✅ clear rejectReason (Restore)
//   anything else      ❌
export function statusTransition(input: {
  from: StoryStatus;
  to: StoryStatus;
  reason?: string;
  now?: Date;
}): StatusTransitionResult {
  const { from, to, reason } = input;
  const now = input.now ?? new Date();

  if (from === "draft" && to === "published") {
    return { ok: true, patch: { status: "published", publishedAt: now } };
  }
  if (from === "draft" && to === "rejected") {
    return {
      ok: true,
      patch: {
        status: "rejected",
        rejectReason: reason && reason.length > 0 ? reason : null,
      },
    };
  }
  if (from === "published" && to === "published") {
    return { ok: true, patch: { status: "published" } };
  }
  if (from === "published" && to === "draft") {
    return { ok: true, patch: { status: "draft", publishedAt: null } };
  }
  if (from === "rejected" && to === "draft") {
    return { ok: true, patch: { status: "draft", rejectReason: null } };
  }
  return { ok: false, error: `illegal status transition: ${from} → ${to}` };
}

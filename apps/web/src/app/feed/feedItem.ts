// View-shaped record sent to the feed client. The full Story row carries the
// sanitized body (heavy and not needed for cards); we strip it here and add the
// per-card derived fields (read time, primary category) so the client never
// fetches the deep-dive body just to render a card.
import type { Story } from "@armal/shared/db/schema";

// Single page size for both the SSR page-1 fetch (page.tsx) and subsequent
// /api/feed pages — keeps the user-visible cadence uniform.
export const FEED_PAGE_LIMIT = 20;
// Hard ceiling on what /api/feed will accept via ?limit=.
export const FEED_PAGE_LIMIT_MAX = 50;

export type FeedItem = {
  id: string;
  slug: string;
  title: string;
  shortSummary: string;
  imageUrl: string;
  publishedAt: string | null;
  primaryCategorySlug: string | null;
  primaryCategoryName: string | null;
  readTimeMinutes: number;
};

const CHARS_PER_MINUTE = 1500;

export function readTimeMinutes(bodyMarkdown: string): number {
  return Math.max(1, Math.round(bodyMarkdown.length / CHARS_PER_MINUTE));
}

export function toFeedItem(
  story: Story,
  primary: { slug: string; name: string } | undefined,
): FeedItem {
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    shortSummary: story.shortSummary,
    imageUrl: story.imageUrl,
    publishedAt: story.publishedAt ? story.publishedAt.toISOString() : null,
    primaryCategorySlug: primary?.slug ?? null,
    primaryCategoryName: primary?.name ?? null,
    readTimeMinutes: readTimeMinutes(story.bodyMarkdown),
  };
}

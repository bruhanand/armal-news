// Server-side feed page fetch — composed from listPublishedStories +
// primaryCategoryByStoryIds + the FeedItem adapter. Used by both the SSR
// page-1 fetch (page.tsx) and the cursor-paginated /api/feed route, so the
// FeedItem composition lives in exactly one place. Server-only via the
// db-client transitive import; do not call from a "use client" module.
import {
  listPublishedStories,
  primaryCategoryByStoryIds,
} from "@armal/shared/db/queries";
import type { CategorySlug } from "@armal/shared/constants/categories";
import { toFeedItem, type FeedItem } from "./feedItem";

export async function fetchFeedPage(args: {
  category?: CategorySlug;
  cursor?: string;
  limit: number;
}): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  // Sequential — primaryCategoryByStoryIds depends on the ids returned by
  // listPublishedStories, can't be parallelised.
  const { items: stories, nextCursor } = await listPublishedStories(args);
  const primary = await primaryCategoryByStoryIds(stories.map((s) => s.id));
  const items = stories.map((s) => toFeedItem(s, primary.get(s.id)));
  return { items, nextCursor };
}

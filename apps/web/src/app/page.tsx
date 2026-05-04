import {
  listCategories,
  listPublishedStories,
  primaryCategoryByStoryIds,
} from "@armal/shared/db/queries";
import { isCategorySlug } from "@armal/shared/constants/categories";
import { FeedShell } from "./feed/FeedShell";
import { FEED_PAGE_LIMIT, toFeedItem } from "./feed/feedItem";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requested = params.category;
  const activeSlug =
    requested && isCategorySlug(requested) ? requested : null;

  // SSR page-1 uses the same limit as /api/feed pages so the cadence is
  // uniform — pagination doesn't appear to "speed up" after the first scroll.
  const [allCategories, page1] = await Promise.all([
    listCategories(),
    listPublishedStories({
      category: activeSlug ?? undefined,
      limit: FEED_PAGE_LIMIT,
    }),
  ]);
  // Sequential — primaryCategoryByStoryIds depends on the ids returned above.
  const primary = await primaryCategoryByStoryIds(page1.items.map((s) => s.id));
  const items = page1.items.map((s) => toFeedItem(s, primary.get(s.id)));

  return (
    <main className="min-h-screen bg-bg text-fg">
      <FeedShell
        initial={{ items, nextCursor: page1.nextCursor }}
        categories={allCategories.map((c) => ({ slug: c.slug, name: c.name }))}
        activeSlug={activeSlug}
      />
    </main>
  );
}

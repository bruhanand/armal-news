import { listCategories } from "@armal/shared/db/queries";
import { isCategorySlug } from "@armal/shared/constants/categories";
import { FeedShell } from "./feed/FeedShell";
import { FEED_PAGE_LIMIT } from "./feed/feedItem";
import { fetchFeedPage } from "./feed/fetchFeedPage";

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

  const [allCategories, page1] = await Promise.all([
    listCategories(),
    fetchFeedPage({
      category: activeSlug ?? undefined,
      limit: FEED_PAGE_LIMIT,
    }),
  ]);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <FeedShell
        // key on the active filter so React remounts the shell when the
        // filter changes — paginated state resets cleanly without an effect.
        key={activeSlug ?? "__all__"}
        initial={page1}
        categories={allCategories.map((c) => ({ slug: c.slug, name: c.name }))}
        activeSlug={activeSlug}
      />
    </main>
  );
}

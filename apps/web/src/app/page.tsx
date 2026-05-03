import { listCategories, listPublishedStories } from "@armal/shared/db/queries";
import { isCategorySlug } from "@armal/shared/constants/categories";
import { CategoryControls } from "./CategoryControls";

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

  const [allCategories, published] = await Promise.all([
    listCategories(),
    listPublishedStories({ category: activeSlug ?? undefined }),
  ]);

  return (
    <main>
      <CategoryControls
        categories={allCategories.map((c) => ({ slug: c.slug, name: c.name }))}
        activeSlug={activeSlug}
      />

      {published.length === 0 ? (
        <p>No published stories yet.</p>
      ) : (
        published.map((story) => (
          <article
            key={story.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={story.imageUrl}
              alt=""
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                objectFit: "cover",
                marginBottom: "16px",
              }}
            />
            <h1 style={{ marginTop: 0 }}>{story.title}</h1>
            <p style={{ fontStyle: "italic", color: "#444" }}>
              {story.shortSummary}
            </p>
            <a href={`/story/${story.slug}`}>Read deep dive →</a>
          </article>
        ))
      )}
    </main>
  );
}

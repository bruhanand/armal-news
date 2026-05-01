import { notFound } from "next/navigation";
import { getPublishedStoryBySlug } from "@armal/shared/db/queries";

export const dynamic = "force-dynamic";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) notFound();

  return (
    <main>
      <article>
        {story.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.imageUrl}
            alt=""
            style={{ width: "100%", marginBottom: "16px" }}
          />
        ) : null}
        <h1>{story.title}</h1>
        <p style={{ fontStyle: "italic", color: "#444" }}>
          {story.shortSummary}
        </p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            background: "transparent",
            margin: 0,
          }}
        >
          {story.bodyMarkdown}
        </pre>
        <p style={{ marginTop: "24px" }}>
          <a href={story.sourceLink} rel="noreferrer noopener" target="_blank">
            View source
          </a>
        </p>
      </article>
    </main>
  );
}

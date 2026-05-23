import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb, stories } from "@armal/shared/db";
import {
  categorySlugsByStoryIds,
  listCategories,
  listDraftStories,
} from "@armal/shared/db/queries";
import { StoryEditor } from "./StoryEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function relTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default async function StoryEditorPage({ params }: Props) {
  const { id } = await params;
  const db = getDb();
  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, id))
    .limit(1);
  if (!story) notFound();
  if (story.status === "rejected") {
    // Rejected stories aren't editable — the design only shows the editor for
    // draft + published rows. Restore first, then edit.
    notFound();
  }

  // Left-pane list mirrors the design's two-pane editor — drafts only.
  // Published-row edits open the same page but the left list is the
  // back-link button instead of a sibling list (matches the design's
  // intent that the published-list table is the navigation surface).
  const siblings =
    story.status === "draft" ? await listDraftStories({ limit: 50 }) : [];

  // Categories: full seeded list + the slugs the Story is currently mapped to.
  const [allCategories, slugMap] = await Promise.all([
    listCategories(),
    categorySlugsByStoryIds([story.id]),
  ]);
  const initialSlugs = slugMap.get(story.id) ?? [];

  return (
    <>
      <div className="content-head">
        <div className="ch-title">
          {story.status === "published"
            ? "Editing published story"
            : "Editing draft"}
        </div>
        <div className="ch-actions">
          <span className={`badge badge-${story.status}`}>
            {story.status === "published" ? "Published" : "Draft"}
          </span>
        </div>
      </div>
      <div className="detail-split">
        <aside className="detail-list">
          {story.status === "draft" &&
            siblings.map((s) => (
              <Link
                key={s.id}
                href={`/stories/${s.id}`}
                className={`dl-item${s.id === story.id ? " active" : ""}`}
              >
                <div
                  className="dl-thumb"
                  style={{ backgroundImage: `url(${s.imageUrl})` }}
                />
                <div className="dl-info">
                  <div className="dl-t">{s.title}</div>
                  <div className="dl-m">
                    <span className="badge badge-draft" style={{ fontSize: 10 }}>
                      Draft
                    </span>
                    {relTime(s.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          {story.status === "published" && (
            <div style={{ padding: 16 }}>
              <Link href="/published" className="btn btn-secondary btn-sm">
                ← Back to published list
              </Link>
            </div>
          )}
        </aside>
        <section className="detail-pane">
          <StoryEditor
            story={{
              id: story.id,
              status: story.status,
              title: story.title,
              shortSummary: story.shortSummary,
              bodyHtml: story.bodyMarkdown,
              imageUrl: story.imageUrl,
              sourceLink: story.sourceLink,
              externalId: story.externalId,
              slug: story.slug,
              tags: story.tags,
            }}
            allCategories={allCategories.map((c) => ({
              slug: c.slug,
              name: c.name,
            }))}
            initialSlugs={initialSlugs}
          />
        </section>
      </div>
    </>
  );
}

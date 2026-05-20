import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, storyCategories } from "@armal/shared/db";
import { getPublishedStoryBySlug, listCategories } from "@armal/shared/db/queries";
import type { Story, Category } from "@armal/shared/db/schema";
import { DeepDiveShortcuts } from "./DeepDiveShortcuts";

export const dynamic = "force-dynamic";

// Tablet (768–1023px) collapses to the desktop layout at the same 680px
// reading-column max-width — chosen because reading-column width drives
// readability more than viewport size.

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [story, allCategories] = await Promise.all([
    getPublishedStoryBySlug(slug),
    listCategories(),
  ]);
  if (!story) notFound();

  const categoryName = await firstCategoryNameFor(story.id, allCategories);
  const sourceHost = parseSourceHost(story.sourceLink);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <DeepDiveShortcuts sourceLink={story.sourceLink} />
      {/* Desktop / tablet header — slim back-to-feed link. Mobile (<768px) uses
       * the glass back-button overlay on the hero instead (ADR 0004 § L). */}
      <header className="hidden md:flex items-center px-8 py-5 text-sm text-muted">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-medium hover:text-fg transition-colors"
        >
          <ChevLeft className="h-4 w-4" />
          Back to feed
        </Link>
      </header>

      <article>
        {/* Mobile hero (<768px): 38vh, glass back button overlay. */}
        <div className="relative h-[38vh] w-full overflow-hidden md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          {/* Top fade for back-button contrast against light hero images. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" />
          <Link
            href="/"
            aria-label="Back to feed"
            className="absolute left-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(20,16,8,0.42)] text-[#FBF7EF] backdrop-blur-md hover:bg-[rgba(20,16,8,0.55)] transition-colors"
          >
            <ChevLeft className="h-[18px] w-[18px]" />
          </Link>
        </div>

        {/* Reading column. 680px on desktop; full-width with 24px padding on
         * mobile. Same sub-tree drives both layouts; only chrome diverges. */}
        <div className="mx-auto max-w-[680px] px-6 py-7 md:px-0 md:py-8">
          {/* Desktop hero (≥768px): part of the column, 16:9, rounded. */}
          <div className="hidden md:block relative w-full aspect-[16/9] overflow-hidden rounded-card mb-6">
            <Image
              src={story.imageUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 680px, 100vw"
              className="object-cover"
            />
          </div>

          {categoryName && (
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mb-2.5 inline-flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
              />
              {categoryName}
            </div>
          )}

          <h1 className="font-display text-[26px] md:text-[34px] font-semibold leading-[1.18] md:leading-[1.15] tracking-[-0.005em] md:tracking-[-0.01em] text-fg mb-3.5 [text-wrap:balance]">
            {story.title}
          </h1>

          <p className="font-display italic text-[17px] md:text-[19px] leading-[1.5] text-muted mb-5 md:mb-5 md:pb-5 md:border-b md:border-border [text-wrap:pretty]">
            &ldquo;{story.shortSummary}&rdquo;
          </p>

          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: story.bodyMarkdown }}
          />

          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5">
              {story.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center h-[22px] px-2 font-mono text-[11px] text-muted bg-surface border border-border rounded-[6px]"
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          <a
            href={story.sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 bg-accent text-[#FBF7EF] rounded-full font-body font-semibold text-[13px] hover:opacity-90 transition-opacity"
          >
            View source
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          {/* Source-host line — mobile only. ADR 0004 § L: desktop browsers
           * preview the destination URL on hover via the status bar; mobile
           * browsers do not, so the host line is a deliberate trust preview
           * on mobile only. Do NOT unify across breakpoints. */}
          {sourceHost && (
            <span className="block md:hidden mt-2.5 font-mono text-[11px] text-muted">
              {sourceHost}
            </span>
          )}
        </div>
      </article>
    </main>
  );
}

function parseSourceHost(sourceLink: string): string | null {
  try {
    const url = new URL(sourceLink);
    const host = url.host.replace(/^www\./, "");
    const segments = url.pathname.split("/").filter(Boolean);
    return [host, ...segments].join(" / ");
  } catch {
    return null;
  }
}

// Pick the first category that this Story belongs to as the eyebrow label.
// Stories can have multiple categories; the design pack shows just one. We
// pick the lowest sort_order match so the choice is deterministic.
async function firstCategoryNameFor(
  storyId: Story["id"],
  allCategories: Category[],
): Promise<string | null> {
  const rows = await getDb()
    .select({ categoryId: storyCategories.categoryId })
    .from(storyCategories)
    .where(eq(storyCategories.storyId, storyId));
  const matchedIds = new Set(rows.map((r) => r.categoryId));
  const sorted = [...allCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.find((c) => matchedIds.has(c.id))?.name ?? null;
}

function ChevLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

import Link from "next/link";
import {
  categorySlugsByStoryIds,
  countStoriesByStatus,
  listCategories,
  listPublishedStories,
} from "@armal/shared/db/queries";
import { SearchInput } from "../_components/SearchInput";
import { StatusTabs } from "../_components/StatusTabs";
import { PublishedRowActions } from "../_components/PublishedRowActions";

export const dynamic = "force-dynamic";

type Search = { q?: string };

function fmtPubDate(d: Date | null): string {
  if (!d) return "—";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return `Today ${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }
  const diff = Math.floor((now.getTime() - d.getTime()) / (24 * 3600_000));
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toISOString().slice(0, 10);
}

export default async function PublishedPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = sp.q;
  const [{ items }, counts, allCategories] = await Promise.all([
    listPublishedStories({ q, limit: 200 }),
    countStoriesByStatus(),
    listCategories(),
  ]);
  const slugs = await categorySlugsByStoryIds(items.map((i) => i.id));
  const nameBySlug = new Map(allCategories.map((c) => [c.slug, c.name]));

  return (
    <>
      <div className="content-head">
        <div className="ch-title">
          Published stories
          <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 12, marginLeft: 6 }}>
            {items.length} {items.length === 1 ? "story" : "stories"}
          </span>
        </div>
        <div className="ch-actions">
          <SearchInput placeholder="Search published…" />
          <StatusTabs active="published" counts={counts} />
        </div>
      </div>
      {items.length === 0 ? (
        <div className="empty">
          <h3>No published stories</h3>
          <p>Approved drafts will appear here once published.</p>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th className="th-img"></th>
                <th>Title / Summary</th>
                <th>Categories</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="td-inner td-thumb">
                      <div
                        className="thumb"
                        style={{ backgroundImage: `url(${s.imageUrl})` }}
                      />
                    </div>
                  </td>
                  <td>
                    <Link href={`/stories/${s.id}`} className="td-inner td-title">
                      <div className="tt">{s.title}</div>
                      <div className="ts">{s.shortSummary}</div>
                    </Link>
                  </td>
                  <td>
                    <div className="td-inner td-cats">
                      <div className="cat-list">
                        {(slugs.get(s.id) ?? []).map((slug) => (
                          <span
                            key={slug}
                            className="cat-pill selected"
                            style={{ fontSize: 10 }}
                          >
                            {nameBySlug.get(slug) ?? slug}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      className="td-inner td-time"
                      style={{ color: "var(--success)" }}
                    >
                      {fmtPubDate(s.publishedAt)}
                    </div>
                  </td>
                  <td>
                    <div className="td-inner td-actions">
                      <PublishedRowActions
                        id={s.id}
                        title={s.title}
                        slug={s.slug}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

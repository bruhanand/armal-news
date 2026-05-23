import {
  countStoriesByStatus,
  listRejectedStories,
} from "@armal/shared/db/queries";
import { SearchInput } from "../_components/SearchInput";
import { StatusTabs } from "../_components/StatusTabs";
import { RejectedRowActions } from "../_components/RejectedRowActions";

export const dynamic = "force-dynamic";

type Search = { q?: string };

function relTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} days ago`;
  return d.toISOString().slice(0, 10);
}

export default async function RejectedPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = sp.q;
  const [rejected, counts] = await Promise.all([
    listRejectedStories({ q }),
    countStoriesByStatus(),
  ]);

  return (
    <>
      <div className="content-head">
        <div className="ch-title">
          Rejected stories
          <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 12, marginLeft: 6 }}>
            {rejected.length} {rejected.length === 1 ? "story" : "stories"}
          </span>
        </div>
        <div className="ch-actions">
          <SearchInput placeholder="Search rejected…" />
          <StatusTabs active="rejected" counts={counts} />
        </div>
      </div>
      {rejected.length === 0 ? (
        <div className="empty">
          <h3>No rejected stories</h3>
          <p>Rejected drafts will appear here.</p>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th className="th-img"></th>
                <th>Title / Summary</th>
                <th>Reason</th>
                <th>Rejected</th>
                <th></th>
              </tr>
            </thead>
            <tbody style={{ opacity: 0.86 }}>
              {rejected.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="td-inner td-thumb">
                      <div
                        className="thumb"
                        style={{
                          backgroundImage: `url(${s.imageUrl})`,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="td-inner td-title">
                      <div className="tt" style={{ color: "var(--muted)" }}>
                        {s.title}
                      </div>
                      <div className="ts" style={{ color: "var(--subtle)" }}>
                        {s.shortSummary}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      className="td-inner"
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        maxWidth: 160,
                      }}
                    >
                      {s.rejectReason ?? "—"}
                    </div>
                  </td>
                  <td>
                    <div className="td-inner td-time">
                      {relTime(s.updatedAt)}
                    </div>
                  </td>
                  <td>
                    <div className="td-inner td-actions">
                      <RejectedRowActions id={s.id} title={s.title} />
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

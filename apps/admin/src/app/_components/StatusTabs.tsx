import Link from "next/link";

// Status tabs in the header coexist with the sidebar nav (ADR 0004 § H —
// don't dedupe). Both surfaces show Drafts / Published / Rejected with
// counts; sidebar is persistent navigation, tabs are the within-screen
// filter affordance.
export function StatusTabs({
  active,
  counts,
}: {
  active: "draft" | "published" | "rejected";
  counts: { draft: number; published: number; rejected: number };
}) {
  return (
    <div className="status-tabs">
      <Link
        href="/"
        className={`st-tab${active === "draft" ? " active" : ""}`}
      >
        Draft <span className="stc">{counts.draft}</span>
      </Link>
      <Link
        href="/published"
        className={`st-tab${active === "published" ? " active" : ""}`}
      >
        Published <span className="stc">{counts.published}</span>
      </Link>
      <Link
        href="/rejected"
        className={`st-tab${active === "rejected" ? " active" : ""}`}
      >
        Rejected <span className="stc">{counts.rejected}</span>
      </Link>
    </div>
  );
}

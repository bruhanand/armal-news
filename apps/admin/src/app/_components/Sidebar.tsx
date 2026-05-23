import Link from "next/link";
import { countStoriesByStatus } from "@armal/shared/db/queries";
import { SidebarItem } from "./SidebarItem";

export async function Sidebar() {
  const counts = await countStoriesByStatus();
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">Armal Admin</div>
        <div className="sb-sub">Internal · v0.1</div>
      </div>
      <div className="sb-section">Content</div>
      <SidebarItem href="/" label="Drafts" count={counts.draft} />
      <SidebarItem
        href="/published"
        label="Published"
        count={counts.published}
      />
      <SidebarItem
        href="/rejected"
        label="Rejected"
        count={counts.rejected}
      />
      <div className="sb-section">System</div>
      <SidebarItem href="/settings" label="Settings" />
      <div style={{ marginTop: "auto" }}>
        <Link
          href="/"
          className="sb-item"
          style={{ fontSize: 11, color: "var(--subtle)" }}
        >
          admin@armal.news
        </Link>
      </div>
    </aside>
  );
}

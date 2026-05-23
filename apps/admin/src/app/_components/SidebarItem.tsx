"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Drafts ("/") is also the scope for the draft detail editor at
// /stories/[id] — keep the sidebar pill lit while the admin edits.
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/stories");
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarItem({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count?: number;
}) {
  const pathname = usePathname() ?? "/";
  const active = isActive(pathname, href);
  return (
    <Link href={href} className={`sb-item${active ? " active" : ""}`}>
      {label}
      {count !== undefined && <span className="sb-count">{count}</span>}
    </Link>
  );
}

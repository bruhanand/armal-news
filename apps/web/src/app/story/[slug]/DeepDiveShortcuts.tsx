"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { matchDeepDiveShortcut } from "@/app/feed/shortcuts";

// Desktop-only keyboard shortcuts for the deep-dive page. The keydown
// listener is registered iff (min-width: 768px) matches at mount — mobile
// UAs have no physical keyboard. Mirrors the FeedShell listener pattern.
export function DeepDiveShortcuts({ sourceLink }: { sourceLink: string }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    function handler(e: KeyboardEvent) {
      const action = matchDeepDiveShortcut(e);
      if (!action) return;
      e.preventDefault();
      if (action === "viewSource") {
        window.open(sourceLink, "_blank", "noopener,noreferrer");
      } else if (action === "close") {
        router.push("/");
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, sourceLink]);

  return null;
}

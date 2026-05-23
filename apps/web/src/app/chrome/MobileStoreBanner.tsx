"use client";

import { useCallback, useEffect, useState } from "react";
import type { MobilePlatform } from "./ua";

// 56px-tall top banner on iOS/Android UAs only. The server picks the platform
// (via `headers()`); this component owns the dismissal state.
//
// FOUC: the pre-paint <ThemeScript /> sets `data-mobile-banner-dismissed` on
// <html> when a fresh dismissal sits in localStorage (≥30 days). The banner
// reads that flag on mount and stays hidden, preventing the layout-shift you'd
// get from "render → effect → unmount" on every dismissed page-load.

const DISMISS_KEY = "armal-mobile-banner-dismissed-at";
// TODO(slice-0010): replace with the real App Store + Play Store URLs once
// the native app listings ship.
const IOS_URL = "https://apps.apple.com/app/armal-news/id000000000";
const ANDROID_URL =
  "https://play.google.com/store/apps/details?id=news.armal.app";

const COPY: Record<
  MobilePlatform,
  { tagline: string; cta: string; href: string }
> = {
  ios: {
    tagline: "Better reading in the iOS app.",
    cta: "Open",
    href: IOS_URL,
  },
  android: {
    tagline: "Better reading in the Android app.",
    cta: "Install",
    href: ANDROID_URL,
  },
};

export function MobileStoreBanner({ platform }: { platform: MobilePlatform }) {
  // Initial render assumes "show" — the pre-paint script in <head> handles the
  // dismissed case by setting data-mobile-banner-dismissed on <html>, which
  // the CSS layer below honors.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (document.documentElement.hasAttribute("data-mobile-banner-dismissed")) {
      setDismissed(true);
    }
  }, []);

  const onDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      document.documentElement.setAttribute(
        "data-mobile-banner-dismissed",
        "",
      );
    } catch {
      // localStorage disabled — banner stays dismissed for this session.
    }
  }, []);

  if (dismissed) return null;
  const { tagline, cta, href } = COPY[platform];

  return (
    <div
      data-mobile-store-banner
      className="md:hidden fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-surface px-3"
      role="region"
      aria-label="Open Armal News in the native app"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] border border-border bg-bg font-display text-[22px] font-semibold italic leading-none text-accent">
        A
      </div>
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-[13px] font-semibold text-fg">
          Open in the Armal News app
        </span>
        <span className="text-[11px] text-muted">{tagline}</span>
      </div>
      <a
        href={href}
        className="inline-flex h-8 items-center rounded-full bg-accent px-3.5 text-[12px] font-semibold text-[#FBF7EF]"
      >
        {cta}
      </a>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss app banner"
        className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-bg text-muted"
      >
        <svg
          className="h-2.5 w-2.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

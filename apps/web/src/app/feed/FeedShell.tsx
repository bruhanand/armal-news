"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { FeedItem } from "./feedItem";
import {
  CategoryIcon,
  ChevronDown,
  DownloadIcon,
  MenuIcon,
  SunIcon,
  XIcon,
} from "./icons";
import { CategoryMenu, type CategoryOption } from "./CategoryMenu";
import { ShortcutsModal } from "./ShortcutsModal";
import { matchFeedShortcut, type ShortcutAction } from "./shortcuts";

// One DOM tree, two CSS surfaces. The mobile snap container and the desktop
// grid container coexist in markup; Tailwind's `md:` breakpoint hides one or
// the other. `<768px` → snap, `≥768px` → grid (tablet inherits the desktop
// reading layout because reading-column width drives readability more than
// viewport size — same call as the deep-dive page).

type Props = {
  initial: { items: FeedItem[]; nextCursor: string | null };
  categories: CategoryOption[];
  activeSlug: string | null;
};

export function FeedShell({ initial, categories, activeSlug }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>(initial.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initial.nextCursor);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const desktopScrollRef = useRef<HTMLDivElement | null>(null);
  const desktopSentinelRef = useRef<HTMLDivElement | null>(null);
  const mobileSentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const desktopAnchorRef = useRef<HTMLButtonElement | null>(null);
  // Cached focused-card index for j/k navigation. null means "find from DOM
  // on next keypress" — refreshed only when stale, so rapid j/k presses skip
  // the per-card getBoundingClientRect reflow loop.
  const focusedIndexRef = useRef<number | null>(null);
  // Open state mirrored to refs so the global keydown listener stays mounted
  // across menu / modal toggles instead of tearing down on every flip.
  const menuOpenRef = useRef(false);
  const shortcutsOpenRef = useRef(false);
  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);
  useEffect(() => {
    shortcutsOpenRef.current = shortcutsOpen;
  }, [shortcutsOpen]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === activeSlug) ?? null,
    [categories, activeSlug],
  );

  // Cursor pagination — one IntersectionObserver per surface. Mobile snaps
  // inside its own scroll container, so its IO needs that container as the
  // `root`; viewport-rooted observation never fires there. Desktop scrolls
  // the page, so its IO uses the default viewport root.
  useEffect(() => {
    if (!nextCursor) return;
    const cursor = nextCursor;
    function onIntersect(entries: IntersectionObserverEntry[]) {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        const params = new URLSearchParams();
        if (activeSlug) params.set("category", activeSlug);
        params.set("cursor", cursor);
        fetch(`/api/feed?${params.toString()}`)
          .then((r) => r.json())
          .then((data: { items: FeedItem[]; nextCursor: string | null }) => {
            setItems((prev) => {
              const seen = new Set(prev.map((p) => p.id));
              const fresh = data.items.filter((it) => !seen.has(it.id));
              return [...prev, ...fresh];
            });
            setNextCursor(data.nextCursor);
          })
          .finally(() => {
            inFlightRef.current = false;
          });
      }
    }
    const observers: IntersectionObserver[] = [];
    if (desktopSentinelRef.current) {
      const io = new IntersectionObserver(onIntersect, {
        rootMargin: "400px 0px",
      });
      io.observe(desktopSentinelRef.current);
      observers.push(io);
    }
    if (mobileSentinelRef.current && mobileScrollRef.current) {
      const io = new IntersectionObserver(onIntersect, {
        root: mobileScrollRef.current,
        rootMargin: "400px 0px",
      });
      io.observe(mobileSentinelRef.current);
      observers.push(io);
    }
    return () => observers.forEach((io) => io.disconnect());
  }, [nextCursor, activeSlug]);

  const scrollToTop = useCallback(() => {
    mobileScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    desktopScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);

  const setFilter = useCallback(
    (slug: string | null) => {
      setMenuOpen(false);
      const target = slug ? `/?category=${slug}` : "/";
      router.replace(target, { scroll: false });
      scrollToTop();
    },
    [router, scrollToTop],
  );

  // Desktop-only keyboard shortcuts. Listener is registered iff the
  // (min-width: 768px) media query matches at mount time — mobile UAs have
  // no physical keyboard.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    function getCards(): NodeListOf<HTMLAnchorElement> | null {
      const root = desktopScrollRef.current;
      return root
        ? root.querySelectorAll<HTMLAnchorElement>("a[data-card-index]")
        : null;
    }

    function findIndexFromDom(cards: NodeListOf<HTMLAnchorElement>): number {
      const root = desktopScrollRef.current;
      if (!root || cards.length === 0) return 0;
      const center =
        root.getBoundingClientRect().top + root.clientHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    }

    function focusedIndex(cards: NodeListOf<HTMLAnchorElement>): number {
      const cached = focusedIndexRef.current;
      if (cached != null && cached < cards.length) return cached;
      const idx = findIndexFromDom(cards);
      focusedIndexRef.current = idx;
      return idx;
    }

    const ACTIONS: Record<ShortcutAction, () => void> = {
      next: () => {
        const cards = getCards();
        if (!cards || cards.length === 0) return;
        const next = Math.min(cards.length - 1, focusedIndex(cards) + 1);
        focusedIndexRef.current = next;
        cards[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
      prev: () => {
        const cards = getCards();
        if (!cards || cards.length === 0) return;
        const next = Math.max(0, focusedIndex(cards) - 1);
        focusedIndexRef.current = next;
        cards[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
      open: () => {
        const cards = getCards();
        if (!cards || cards.length === 0) return;
        cards[focusedIndex(cards)]?.click();
      },
      close: () => {
        if (shortcutsOpenRef.current) setShortcutsOpen(false);
        else if (menuOpenRef.current) setMenuOpen(false);
      },
      categories: () => setMenuOpen((m) => !m),
      clearFilter: () => setFilter(null),
      panel: () => setShortcutsOpen((s) => !s),
      // ⌥↵ is documented in the modal but only acts on /story/[slug] —
      // intentionally a no-op on the feed.
      viewSource: () => {},
    };

    function handler(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      const action = matchFeedShortcut(e);
      if (!action) return;
      e.preventDefault();
      ACTIONS[action]();
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setFilter]);

  return (
    <>
      {/* DESKTOP HEADER (≥768px) — slim 56px. Per ADR 0004 § M, right cluster
       * order is locked: kbd-hint → theme toggle → Install. */}
      <header className="sticky top-0 z-40 hidden h-14 items-center gap-0 border-b border-border bg-bg px-7 md:flex">
        <button
          type="button"
          onClick={scrollToTop}
          className="flex-1 cursor-pointer whitespace-nowrap text-left font-display text-[21px] font-medium italic tracking-[-0.005em] text-fg"
          aria-label="Armal News — back to top"
        >
          Armal News
        </button>

        <div className="relative flex-none">
          {activeCategory ? (
            <button
              ref={desktopAnchorRef}
              type="button"
              onClick={() => setFilter(null)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-accent bg-accent px-3.5 py-1.5 text-[13px] font-medium text-[#FBF7EF]"
              aria-label={`Clear ${activeCategory.name} filter`}
            >
              {activeCategory.name}
              <XIcon className="h-[10px] w-[10px]" />
            </button>
          ) : (
            <button
              ref={desktopAnchorRef}
              type="button"
              onClick={() => setMenuOpen((m) => !m)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${
                menuOpen
                  ? "border-fg bg-fg text-bg"
                  : "border-border bg-surface text-fg"
              }`}
            >
              All categories
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
          {menuOpen && (
            <CategoryMenu
              variant="dropdown"
              categories={categories}
              activeSlug={activeSlug}
              onPick={setFilter}
              onClose={() => setMenuOpen(false)}
              anchorRef={desktopAnchorRef}
            />
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-2.5 font-mono text-[11px] text-muted hover:text-fg"
          >
            <kbd className="rounded border border-border bg-surface px-1.5 py-px text-[10px] text-fg">
              ⌥
            </kbd>
            <kbd className="rounded border border-border bg-surface px-1.5 py-px text-[10px] text-fg">
              K
            </kbd>
            shortcuts
          </button>
          {/* TODO(slice-0009): wire theme toggle (cycles light → dark → system). */}
          <button
            type="button"
            aria-label="Theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:text-fg"
          >
            <SunIcon className="h-4 w-4" />
          </button>
          {/* TODO(slice-0009): wire PWA install (beforeinstallprompt). */}
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3.5 text-[12px] font-semibold text-[#FBF7EF]"
          >
            <DownloadIcon className="h-[13px] w-[13px]" />
            Install app
          </button>
        </div>
      </header>

      {/* DESKTOP GRID (≥768px) — 2 columns at md+, scroll on the page. */}
      <div
        ref={desktopScrollRef}
        className="hidden min-h-[calc(100vh-56px)] bg-bg md:block"
      >
        {items.length === 0 ? (
          <p className="mx-auto max-w-[1160px] px-5 pt-12 text-center text-muted">
            No published stories yet.
          </p>
        ) : (
          <div className="mx-auto max-w-[1160px] px-5 pb-16 pt-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {items.map((it, i) => (
                <DesktopCard key={it.id} item={it} index={i} />
              ))}
            </div>
            {nextCursor && (
              <div ref={desktopSentinelRef} className="h-12" aria-hidden />
            )}
          </div>
        )}
      </div>

      {/* MOBILE SNAP (<768px) — full-screen vertical-snap, 100dvh per card. */}
      <div
        ref={mobileScrollRef}
        className="h-[100dvh] snap-y snap-mandatory overflow-y-auto md:hidden"
      >
        {items.length === 0 ? (
          <p className="flex h-[100dvh] items-center justify-center text-muted">
            No published stories yet.
          </p>
        ) : (
          <>
            {items.map((it) => (
              <MobileCard
                key={it.id}
                item={it}
                activeCategory={activeCategory}
                onClearFilter={() => setFilter(null)}
              />
            ))}
            {nextCursor && (
              <div ref={mobileSentinelRef} className="h-px" aria-hidden />
            )}
          </>
        )}

        {/* Floating "open category sheet" affordance — only visible when no
         * filter is active (filtered state already exposes the dismiss ✕ on
         * the centered pill). Sits above the iOS home indicator. */}
        {!activeCategory && (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open categories"
            className="fixed bottom-6 right-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/85 text-fg shadow-card backdrop-blur md:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* MOBILE BOTTOM SHEET — only mounted when open. Lives outside the snap
       * container so it doesn't snap. */}
      {menuOpen && (
        <div className="md:hidden">
          <CategoryMenu
            variant="sheet"
            categories={categories}
            activeSlug={activeSlug}
            onPick={setFilter}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      )}

      {shortcutsOpen && (
        <ShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}
    </>
  );
}

function DesktopCard({ item, index }: { item: FeedItem; index: number }) {
  return (
    <Link
      href={`/story/${item.slug}`}
      data-card-index={index}
      className="group block overflow-hidden rounded-[16px] border border-border bg-surface shadow-card transition-shadow hover:shadow-drop"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={item.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
          style={{
            background:
              "linear-gradient(0deg, var(--surface), transparent)",
          }}
        />
      </div>
      <div className="px-7 pt-4">
        {item.primaryCategoryName && (
          <div className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />
            {item.primaryCategoryName}
          </div>
        )}
        <h2 className="mb-2.5 font-display text-[28px] font-semibold leading-[1.18] tracking-[-0.008em] text-fg [text-wrap:balance]">
          {item.title}
        </h2>
        <p className="font-display text-[17px] italic leading-[1.5] text-muted [text-wrap:pretty]">
          &ldquo;{item.shortSummary}&rdquo;
        </p>
      </div>
      <div className="mt-3.5 flex items-center justify-between border-t border-border px-7 py-3 font-mono text-[11px] text-muted">
        <span>{item.readTimeMinutes} min read</span>
        <span className="font-medium text-fg group-hover:text-accent">
          Read more →
        </span>
      </div>
    </Link>
  );
}

function MobileCard({
  item,
  activeCategory,
  onClearFilter,
}: {
  item: FeedItem;
  activeCategory: CategoryOption | null;
  onClearFilter: () => void;
}) {
  return (
    <article className="relative h-[100dvh] w-full snap-start">
      {/* Tap target covering the full card. aria-hidden + tabIndex={-1} so
       * screen readers and keyboard users don't land on this anonymous
       * region — they land on the headline link below instead. */}
      <Link
        href={`/story/${item.slug}`}
        className="absolute inset-0 z-10"
        aria-hidden
        tabIndex={-1}
      />

      {/* Image fills the top half. Plain <img> rather than next/image: the
       * snap container fights next/image's intrinsic-aspect / fill modes,
       * and CDN delivery already gives us optimised renditions. */}
      <div className="relative h-1/2 w-full overflow-hidden bg-[#2B3960]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
        {/* Top scrim for chrome contrast against light hero images. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" />

        {/* Chrome overlays. Two layouts: unfiltered (icon + wordmark + spacer)
         * vs filtered (centered wordmark + dismissible pill). */}
        {activeCategory ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-2 px-4 pt-14 text-[#FBF7EF]">
            <span className="font-display text-[17px] font-medium uppercase italic tracking-[0.08em] opacity-90">
              Armal News
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClearFilter();
              }}
              aria-label={`Clear ${activeCategory.name} filter`}
              className="pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[rgba(252,246,235,0.94)] py-[5px] pl-[11px] pr-[5px] text-[12px] font-medium leading-none text-[#2F2A1F] shadow-[0_4px_12px_-6px_rgba(0,0,0,0.35)] backdrop-blur"
            >
              <span className="inline-flex h-[13px] w-[13px] opacity-65">
                <CategoryIcon
                  slug={activeCategory.slug}
                  className="h-[13px] w-[13px]"
                />
              </span>
              {activeCategory.name}
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/10">
                <XIcon className="h-2.5 w-2.5" />
              </span>
            </button>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-14 text-[#FBF7EF]">
            <span className="absolute left-4 top-14 inline-flex opacity-55">
              <CategoryIcon
                slug={item.primaryCategorySlug}
                className="h-6 w-6"
              />
            </span>
            <span className="block text-center font-display text-[15px] font-medium uppercase italic tracking-[0.06em] opacity-60">
              Armal News
            </span>
          </div>
        )}
      </div>

      {/* Headline card straddling the seam — focusable Link inside so the
       * card is reachable by keyboard / screen reader. The anchor has
       * pointer-events-auto so a tap on the headline reads as a normal click
       * rather than passing through to the overlay link below. */}
      <div className="relative z-20 h-0">
        <div className="absolute inset-x-4 -top-px -translate-y-1/2 rounded-card border border-border bg-surface px-6 py-5 shadow-drop">
          <Link
            href={`/story/${item.slug}`}
            className="pointer-events-auto block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <h3 className="m-0 font-display text-[24px] font-semibold leading-[1.18] tracking-[-0.005em] text-fg [text-wrap:balance]">
              {item.title}
            </h3>
          </Link>
        </div>
      </div>

      {/* Bottom half — italic summary panel + tap CTA. */}
      <div className="relative flex h-1/2 flex-col items-center justify-center bg-bg px-7 pb-14 pt-16">
        <p className="m-0 text-center font-display text-[17px] italic leading-[1.45] text-fg [text-wrap:pretty]">
          &ldquo;{item.shortSummary}&rdquo;
        </p>
        <span className="absolute bottom-10 right-6 text-[13px] font-medium text-muted">
          Tap to read →
        </span>
      </div>

    </article>
  );
}

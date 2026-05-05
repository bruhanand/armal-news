"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CategoryIcon, CheckIcon } from "./icons";

export type CategoryOption = { slug: string; name: string };

type Props = {
  categories: CategoryOption[];
  activeSlug: string | null;
  onClose: () => void;
  // Called after the user picks (or clears) a category. The menu doesn't do
  // the navigation itself — Row uses next/link with an href, so navigation
  // is the browser's job. The shell uses this hook to reset its own state
  // (close the menu, scroll to top) on a successful pick.
  onPicked: () => void;
  variant: "dropdown" | "sheet";
  // When variant === "dropdown" this is the anchor button rect — used to
  // position the popover; the sheet variant ignores it.
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
};

function hrefFor(slug: string | null): string {
  return slug ? `/?category=${slug}` : "/";
}

export function CategoryMenu({
  categories,
  activeSlug,
  onClose,
  onPicked,
  variant,
  anchorRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Click-outside / Esc closing for both variants. Esc is also handled by
  // the parent shell's global keydown listener — duplicated here so the menu
  // is self-contained in tests / unit usage.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(t)) {
        if (anchorRef?.current && anchorRef.current.contains(t)) return;
        onClose();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, anchorRef]);

  if (variant === "dropdown") {
    return (
      <div
        ref={containerRef}
        role="menu"
        aria-label="Filter by category"
        className="absolute left-1/2 top-[60px] z-50 w-[264px] -translate-x-1/2 overflow-hidden rounded-card border border-border bg-surface py-1.5 shadow-drop"
      >
        <Row
          variant="dropdown"
          name="All stories"
          active={activeSlug === null}
          italic
          href={hrefFor(null)}
          onPicked={onPicked}
        />
        <div className="my-1 h-px bg-border" />
        {categories.map((c) => (
          <Row
            key={c.slug}
            variant="dropdown"
            slug={c.slug}
            name={c.name}
            active={activeSlug === c.slug}
            href={hrefFor(c.slug)}
            onPicked={onPicked}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filter by category"
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-[var(--backdrop)]"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[70vh] overflow-hidden rounded-t-sheet border border-b-0 border-border bg-surface shadow-sheet"
      >
        <div className="flex justify-center pb-1 pt-2">
          <span className="block h-1 w-9 rounded-full bg-muted/45" />
        </div>
        <div className="px-0 pb-1 pt-1.5 text-center font-display text-[18px] font-medium tracking-[-0.005em] text-fg">
          Categories
        </div>
        <div className="overflow-y-auto pb-6 pt-2">
          <Row
            variant="sheet"
            name="All stories"
            active={activeSlug === null}
            italic
            href={hrefFor(null)}
            onPicked={onPicked}
          />
          {categories.map((c) => (
            <Row
              key={c.slug}
              variant="sheet"
              slug={c.slug}
              name={c.name}
              active={activeSlug === c.slug}
              href={hrefFor(c.slug)}
              onPicked={onPicked}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const ROW_STYLE = {
  dropdown: {
    button: "flex h-[42px] w-full items-center gap-2.5 px-3.5 text-left text-sm font-medium hover:bg-bg",
    iconWrap: "inline-flex h-[18px] w-[18px] items-center justify-center",
    iconSize: "h-[18px] w-[18px]",
    label: "",
    italic: "italic opacity-75",
    check: "ml-auto text-accent",
    checkSize: "h-4 w-4",
  },
  sheet: {
    button: "flex h-14 w-full items-center gap-4 border-t border-border px-6 text-left first:border-t-0",
    iconWrap: "inline-flex h-7 w-7 items-center justify-center",
    iconSize: "h-[22px] w-[22px]",
    label: "flex-1 text-base font-medium",
    italic: "italic opacity-85",
    check: "text-accent",
    checkSize: "h-[18px] w-[18px]",
  },
};

function Row({
  variant,
  slug,
  name,
  active,
  italic,
  href,
  onPicked,
}: {
  variant: "dropdown" | "sheet";
  slug?: string;
  name: string;
  active: boolean;
  italic?: boolean;
  href: string;
  onPicked: () => void;
}) {
  const s = ROW_STYLE[variant];
  return (
    <Link
      href={href}
      replace
      scroll={false}
      onClick={onPicked}
      aria-current={active ? "page" : undefined}
      className={`${s.button} ${active ? "text-accent" : "text-fg"}`}
    >
      <span className={`${s.iconWrap} ${active ? "text-accent" : "text-muted"}`}>
        <CategoryIcon slug={slug ?? null} className={s.iconSize} />
      </span>
      <span className={`${s.label} ${italic ? s.italic : ""}`}>{name}</span>
      <span className={`${s.check} ${active ? "opacity-100" : "opacity-0"}`}>
        <CheckIcon className={s.checkSize} />
      </span>
    </Link>
  );
}

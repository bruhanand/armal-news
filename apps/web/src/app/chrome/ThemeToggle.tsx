"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isThemeChoice,
  nextThemeChoice,
  THEME_STORAGE_KEY,
  type ThemeChoice,
} from "./theme";

// Single icon-button per ADR 0004 § M. Cycles system → light → dark on click.
// Icon shows the *current* choice (sun = light, moon = dark, monitor = system).
export function ThemeToggle({ className }: { className?: string }) {
  // SSR-safe initial state: "system" (no override). The pre-paint script in
  // <head> already applied the right class to <html>; the icon catches up on
  // first effect.
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeChoice(stored)) setChoice(stored);
    } catch {
      // localStorage disabled — stay on "system".
    }
  }, []);

  // Leaving "theme-light"/"theme-dark" off on "system" lets the
  // prefers-color-scheme media query in tokens.css drive the swap live.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    if (choice === "light") root.classList.add("theme-light");
    else if (choice === "dark") root.classList.add("theme-dark");
  }, [choice]);

  const onClick = useCallback(() => {
    setChoice((c) => {
      const next = nextThemeChoice(c);
      try {
        if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
        else localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // localStorage disabled — choice still updates for this session.
      }
      return next;
    });
  }, []);

  const label = labelFor(choice);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        className ??
        "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:text-fg"
      }
    >
      <ThemeIcon choice={choice} />
    </button>
  );
}

function labelFor(choice: ThemeChoice): string {
  if (choice === "system") return "Theme: system (click for light)";
  if (choice === "light") return "Theme: light (click for dark)";
  return "Theme: dark (click for system)";
}

function ThemeIcon({ choice }: { choice: ThemeChoice }) {
  if (choice === "light") return <SunIcon />;
  if (choice === "dark") return <MoonIcon />;
  return <SystemIcon />;
}

function SunIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Half sun + half moon — reads as "auto / matches the OS."
function SystemIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </svg>
  );
}

// Single source for the keyboard shortcuts modal table and the keydown
// dispatcher in FeedShell. Adding/removing a row here is a one-place change.
//
// `viewSource` (⌥↵) is documented but only acts on /story/[slug] — the feed
// dispatcher returns no action for it, which is fine: the modal still lists
// the binding so users learn about it.

export type ShortcutAction =
  | "next"
  | "prev"
  | "open"
  | "close"
  | "categories"
  | "clearFilter"
  | "viewSource"
  | "panel";

export const SHORTCUTS: ReadonlyArray<{
  action: ShortcutAction;
  label: string;
  keys: string[];
  // Optional context note shown beside the label in the modal — used to
  // mark shortcuts that don't act on the current surface.
  hint?: string;
}> = [
  { action: "next", label: "Next story", keys: ["J", "↓"] },
  { action: "prev", label: "Previous story", keys: ["K", "↑"] },
  { action: "open", label: "Open article", keys: ["↵", "Space"] },
  { action: "close", label: "Close / back", keys: ["Esc"] },
  { action: "categories", label: "Open categories", keys: ["C"] },
  { action: "clearFilter", label: "Clear filter", keys: ["⌥", "C"] },
  {
    action: "viewSource",
    label: "View source",
    keys: ["⌥", "↵"],
    hint: "on article",
  },
  { action: "panel", label: "This panel", keys: ["⌥", "K"] },
];

// Map a keyboard event to a feed-side action, or null if no feed shortcut
// matches. Feed-only context: `viewSource` is never returned here (it lives
// on the deep-dive page).
//
// We match letters by `e.code` (the physical key — "KeyJ", "KeyK", …) rather
// than `e.key` (the composed character) because macOS turns Option+letter
// into typographic dead-keys: Option+K → "˚", Option+C → "ç". `e.key` would
// silently miss those combos. `e.code` is layout-independent on QWERTY.
export function matchFeedShortcut(e: KeyboardEvent): ShortcutAction | null {
  if (e.ctrlKey || e.metaKey) return null;
  if (e.altKey) {
    if (e.code === "KeyK") return "panel";
    if (e.code === "KeyC") return "clearFilter";
    return null;
  }
  if (e.key === "Escape") return "close";
  if (e.code === "KeyJ" || e.key === "ArrowDown") return "next";
  if (e.code === "KeyK" || e.key === "ArrowUp") return "prev";
  if (e.key === "Enter" || e.key === " ") return "open";
  if (e.code === "KeyC") return "categories";
  return null;
}

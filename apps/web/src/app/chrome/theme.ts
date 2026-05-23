// Three-state theme cycle. "system" = no override (live-tracks the OS via the
// prefers-color-scheme media query in tokens.css). "light"/"dark" = the manual
// override classes also declared in tokens.css.
export type ThemeChoice = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "armal-theme";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
}

// system → light → dark → system. Locked by the issue and ADR 0004 § M.
export function nextThemeChoice(current: ThemeChoice): ThemeChoice {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

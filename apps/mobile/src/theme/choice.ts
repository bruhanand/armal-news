// Pure helpers for the theme-choice tristate. Lifted out of ThemeProvider.tsx
// so unit tests can import them without dragging in React / RN / vitest's
// JSX transform.

export type ThemeChoice = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "armal:theme";
const VALID_CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

export function nextThemeChoice(current: ThemeChoice): ThemeChoice {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

export function resolveTheme(
  choice: ThemeChoice,
  systemScheme: ResolvedTheme,
): ResolvedTheme {
  if (choice === "light") return "light";
  if (choice === "dark") return "dark";
  return systemScheme;
}

export function isThemeChoice(value: string | null): value is ThemeChoice {
  return value !== null && (VALID_CHOICES as readonly string[]).includes(value);
}

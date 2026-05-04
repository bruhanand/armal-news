// TS export of the Armal News design tokens. Mirrors `tokens.css` 1:1.
//
// Web consumes the CSS variables directly via `tokens.css` + Tailwind utilities
// (see `tailwind-tokens.css`); React Native (slice 0010) imports this object.
//
// Keep the two themes in lockstep with `tokens.css` — if you change a value
// here, change it there.

export const lightTokens = {
  color: {
    bg: "#F5F0E8",
    surface: "#EFEAE0",
    fg: "#3D3929",
    muted: "#6B5F4D",
    accent: "#CC785C",
    border: "#E0D8C7",
    backdrop: "rgba(20, 16, 8, 0.42)",
  },
  font: {
    display: '"Newsreader", Georgia, serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  },
  radius: {
    card: 12,
    sheet: 16,
    pill: 999,
  },
  shadow: {
    card: "0 10px 28px -16px rgba(40, 30, 15, 0.3), 0 1px 0 rgba(40, 30, 15, 0.04)",
    sheet: "0 -16px 40px -20px rgba(20, 16, 8, 0.45)",
    drop: "0 4px 20px -8px rgba(40, 30, 15, 0.22), 0 0 0 1px rgba(40, 30, 15, 0.08)",
  },
} as const;

export const darkTokens = {
  color: {
    bg: "#262624",
    surface: "#1E1E1C",
    fg: "#E8E1D4",
    muted: "#A89E8B",
    accent: "#DA7756",
    border: "#3A3733",
    backdrop: "rgba(0, 0, 0, 0.55)",
  },
  font: lightTokens.font,
  radius: lightTokens.radius,
  shadow: {
    card: "0 10px 28px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 0, 0, 0.18)",
    sheet: "0 -16px 40px -20px rgba(0, 0, 0, 0.7)",
    drop: "0 4px 20px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)",
  },
} as const;

export const tokens = {
  light: lightTokens,
  dark: darkTokens,
} as const;

export type ThemeTokens = typeof lightTokens;

# Issue 0007 — Mobile vertical-snap feed + desktop grid + chrome + keyboard shortcuts + cursor pagination

**Labels:** ready-for-agent, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## Design source

Visual contract is locked by [ADR 0004 — design pack v1 is visual source of truth](../adr/0004-design-pack-v1-is-visual-source-of-truth.md), specifically §A (desktop is grid, not snap), §K (keyboard shortcuts), §I (mobile filter pill placement), §M (theme toggle placement).

- [docs/design/desktop-pwa-v1-2.html](../design/desktop-pwa-v1-2.html) §01 *Feed home* (slim header + 2-column grid), §02 *Category selector* (dropdown), §04 *Extra states* (install prompt + keyboard shortcuts modal)
- [docs/design/mobile-feed-v2-3.html](../design/mobile-feed-v2-3.html) §01–§03 (feed home, filtered feed, category bottom sheet)
- [docs/design/components-v1.html](../design/components-v1.html) — buttons, badges, category pill, headline+summary card, drawer/sheet, theme toggle (§09)

## What to build

The full reader UX, with **deliberate mobile/desktop divergence**:

- **Mobile + mobile-web (<768px viewport):** TikTok-style full-screen vertical-snap cards. One Story per screen. Image top half, headline card straddling the seam, italic summary centered in bottom half, "Tap to read →" bottom-right.
- **Desktop / PWA (≥1024px):** Two-column scrollable grid, each card showing image + eyebrow + headline + italic summary + read-time and "Read more →" CTA. Slim header. (Per ADR 0004 § A — this REPLACES the original PRD US 3 "same vertical-snap on web" mandate.)

### Web `/` — feed shell

- Server component fetches the first page server-side; a single client component owns the snap-or-grid interaction (split by viewport), the chrome, and pagination.
- **Mobile snap implementation:** CSS scroll-snap-mandatory with full-screen cards (`100dvh` per card). Document the choice with a one-line comment. Floating overlays at low opacity on every card: Armal News wordmark top-center, category icon top-left, active filter pill (per ADR 0004 § I — when filtered, the wordmark + dismissible pill stack centered above the headline seam, replacing the icon-top-left layout).
- **Desktop grid implementation:** Two-column grid with 20px gutters, card aspect 16:9 image + content block, "Read more →" CTA bottom-right of each card. Slim header (56px): wordmark left, category dropdown center, right cluster (`⌥K shortcuts` hint, theme toggle, Install button).
- Tapping/clicking the wordmark scrolls back to story #1 of the current filter (no router navigation — programmatic scroll within the same shell).
- Active filter renders the category dropdown trigger as the accent pill ("AI Research & Models ✕") on desktop; on mobile, as the centered pill described above.

### Cursor pagination

- `/api/feed?cursor=&limit=` paginates on `published_at` descending. Cursor is the `published_at` of the last item in the previous page (encoded as ISO string).
- Client appends pages as the user nears the end of the loaded set. The swipe (mobile) / scroll (desktop) never blocks on the network if there's a buffered next page.
- Update `listPublishedStories` to actually implement the cursor (the slice-0004 stub currently accepts and ignores it; this slice makes it real).

### Keyboard shortcuts (desktop only)

Add a shortcuts modal triggered by `⌥K`. Per ADR 0004 § K:

| Key | Action |
|-----|--------|
| `J` / `↓` | Next story |
| `K` / `↑` | Previous story |
| `↵` / `Space` | Open article (navigate to `/story/[slug]`) |
| `Esc` | Close / back |
| `C` | Open category dropdown |
| `⌥C` | Clear filter |
| `⌥↵` | Open source link in a new tab (only active when on `/story/[slug]`) |
| `⌥K` | Show / hide this panel |

Wire shortcuts only on `≥768px` viewports; mobile doesn't have a keyboard. Use a single global keydown listener on the feed shell.

### Theme toggle placement (desktop)

Per ADR 0004 § M: in the right cluster of the slim header, **between the keyboard-shortcut hint and the Install button**. Single icon-button (cycles light → dark → system on click). The actual toggle behavior (persistence, OS-default fallback) lands in slice 0009; this slice ships only the placeholder button so the chrome layout matches the design from day one.

### Other carry-overs

- The category bottom sheet (mobile) + dropdown (desktop) from slice 0004 still work; verify they integrate cleanly with the new snap container / grid container.
- Reader's scroll position is intentionally NOT remembered across sessions — opening `/` always lands on story #1 of **All**.
- Theme support: `prefers-color-scheme` only (manual toggle is slice 0009).

## Acceptance criteria

- [ ] Mobile-Safari and Chrome on `<768px` viewport show one Story per screen and snap to the next on swipe up/down. Card layout matches [mobile-feed-v2-3.html §01](../design/mobile-feed-v2-3.html).
- [ ] Desktop browsers (`≥1024px`) show the **two-column grid** from [desktop-pwa-v1-2.html §01](../design/desktop-pwa-v1-2.html). NO snap on desktop.
- [ ] Mobile chrome: wordmark top-center, category icon top-left in default state. When a category is active, the wordmark + dismissible filter pill stack centered above the headline seam (per ADR 0004 § I); category icon is replaced by the centered stack.
- [ ] Desktop chrome: slim header with wordmark left, category dropdown center, right cluster (`⌥K shortcuts` hint, theme toggle button, Install button). Theme toggle button placement: between the kbd-hint and Install (per ADR 0004 § M). The toggle is a placeholder in this slice — wiring lands in 0009.
- [ ] Tapping/clicking the wordmark scrolls back to story #1 of the current filter (no full-page navigation, no flash).
- [ ] Switching filter via the bottom sheet (mobile) / dropdown (desktop) reloads the feed from story #1 within the same shell.
- [ ] Cursor pagination works: scrolling near the end of the loaded set fetches the next page and appends without a visible loading gap on a normal connection. `listPublishedStories` cursor logic is now real (no longer a stub).
- [ ] Reloading `/` after scrolling deep returns the user to story #1 (no position memory).
- [ ] Keyboard shortcuts on desktop: J/K, Space/↵, Esc, C, ⌥C, ⌥K all work as specified. ⌥K opens a modal listing them; Esc closes.
- [ ] No regressions on the deep-dive flow (tap card → `/story/[slug]`).
- [ ] Both light + dark themes render correctly via `prefers-color-scheme`.

## Blocked by

- Issue 0004
- Issue 0005 (deep-dive page must exist for tap-card flow to land on a styled page)

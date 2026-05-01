# Issue 0007 — TikTok-style vertical-snap feed + wordmark scroll-to-top + cursor pagination

**Labels:** needs-triage, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

Replace the basic feed from earlier slices with the full reader UX: full-screen vertical-snap cards, brand chrome, infinite scroll. Single-page web experience matches what readers will see in the mobile app later (slice 0010).

- Web `/` is the feed shell. Server component fetches the first page; a single client component owns the vertical-snap interaction, the floating overlays (wordmark, category icon, pill), and pagination. Picks one snap implementation (CSS scroll-snap is simplest; document the choice in a code comment if non-obvious).
- Each card: image (top third), title overlaid in a headline box at the seam, short summary in italic serif (Newsreader) with curly quotes (bottom two-thirds), "Tap to read →" affordance bottom-right.
- Floating overlays at low opacity on every card: Armal News wordmark top-center; category icon top-left.
- Tapping the wordmark scrolls the feed back to story #1 of the current filter (no router navigation — same scroll container, programmatic scroll).
- Cursor pagination: `/api/feed?cursor=&limit=` paginates on `published_at` (descending). Client appends pages as the user nears the end of the loaded set; the swipe never blocks on the network if there's a buffered next page.
- The category bottom sheet + dismissible pill from 0004 still work; verify they integrate cleanly with the snap container.
- Reader's scroll position is intentionally NOT remembered across sessions — opening `/` always lands on story #1 of **All**.

## Acceptance criteria

- [ ] Mobile-Safari and Chrome on a phone-sized viewport show one Story per screen and snap to the next on swipe up / down.
- [ ] Desktop browsers show the same snap behavior with mouse wheel / trackpad.
- [ ] Wordmark, category icon, and active pill float on every card at low opacity without occluding the headline.
- [ ] Tapping the wordmark scrolls the container back to story #1 of the current filter (no full-page navigation, no flash).
- [ ] Switching filter via the bottom sheet from 0004 reloads the feed from story #1 within the same shell.
- [ ] Scrolling near the end of the loaded set fetches the next cursor page and appends without a visible loading gap on a normal connection.
- [ ] Reloading `/` after scrolling deep returns the user to story #1 (no position memory).
- [ ] No regressions on the deep-dive flow (tap card → `/story/[slug]`).

## Blocked by

- Issue 0004

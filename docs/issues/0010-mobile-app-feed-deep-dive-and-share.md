# Issue 0010 — Mobile app (Expo): feed + category sheet + deep-dive + native share + theme

**Labels:** needs-triage, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

React Native + Expo (managed workflow) app that mirrors the web reader UX, talking to the public web API. No new server-side work — `apps/mobile` consumes `/api/feed` and `/api/story/[slug]` from `apps/web`.

- `apps/mobile` Expo managed workflow scaffold; TypeScript; consumes shared design tokens from `packages/shared/design/tokens` (TS object branch — Tailwind branch is web-only) and shared category constants from `packages/shared/constants/categories`.
- Typed API client targeting `apps/web`'s public routes: `getFeed({ category?, cursor?, limit })`, `getStoryBySlug(slug)`. Base URL configured via Expo env.
- Feed screen: virtualized list (FlashList) with full-screen vertical paging, one Story per screen, infinite scroll. Same card layout as web (image top third, headline, italic short summary), wordmark top-center at low opacity, category icon top-left, "Tap to read →" affordance.
- Category bottom sheet: same nine categories + **All** as web; tap a category to filter from story #1; active filter pill next to the icon; tapping the wordmark scrolls back to story #1.
- Deep-dive screen: image, title, body via `react-native-markdown-display` with code blocks in JetBrains Mono, tags chips, "View source ↗" footer that opens `source_link` in the system browser.
- Native share via `expo-sharing` on the deep-dive screen, sharing the canonical `https://…/story/[slug]` URL so recipients see the SSR'd OG preview from 0006.
- Theme provider: defaults to system color scheme; manual toggle persists via `AsyncStorage`.
- Reader's scroll position is intentionally NOT remembered across app launches — opening the app always lands on story #1.
- App listings (App Store, Play Store) are out of scope for this slice — that's a follow-up. The store URLs from 0009 will be updated when the apps are submitted.

## Acceptance criteria

- [ ] `pnpm --filter mobile start` runs an Expo dev server; the app loads in Expo Go on iOS and Android.
- [ ] Feed screen shows the latest published Stories from the web API; one per screen with vertical paging via FlashList.
- [ ] Category bottom sheet shows **All** + the nine seeded categories; tapping one filters the feed from story #1.
- [ ] Deep-dive screen renders sanitized Markdown with JetBrains Mono code blocks, tags, and a "View source ↗" link that opens in the system browser.
- [ ] The share button invokes the OS share sheet with the canonical `/story/[slug]` URL; pasting that into Slack on a desktop produces the OG preview from 0006.
- [ ] Theme toggle persists via `AsyncStorage` and overrides the system setting.
- [ ] Killing and reopening the app lands on story #1 of **All**.
- [ ] No new server-side endpoints are added in this slice — the mobile app uses the existing public web API.

## Blocked by

- Issue 0006
- Issue 0007

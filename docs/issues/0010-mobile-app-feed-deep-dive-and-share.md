# Issue 0010 — Mobile app (Expo): feed + category sheet + deep-dive + native share + theme

**Labels:** ready-for-agent, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## Design source

Visual contract is locked by [ADR 0004 — design pack v1 is visual source of truth](../adr/0004-design-pack-v1-is-visual-source-of-truth.md), specifically §I (filter pill placement), §J (mobile onboarding), §L (source CTA + host line on mobile).

Implement directly from [docs/design/mobile-feed-v2-3.html](../design/mobile-feed-v2-3.html) — all 7 screens are spec'd:

1. §01 Feed home (vertical-snap, default state with category icon top-left)
2. §02 Feed home with active category filter (wordmark + dismissible pill stacked centered)
3. §03 Category bottom sheet (~70% screen height, drag handle, dimmed backdrop, 56px rows)
4. §04 Deep-dive (initial + scrolled states; back-button glass overlay; pull quote; tag chips; **accent source pill PLUS mono `source-host` line**)
5. §05 First-launch onboarding (single screen — "A" mark, wordmark, lede, Continue, "No account needed")
6. §06 App icon (italic Newsreader "A" on warm-paper, light + dark variants, iOS rounded-square mask)
7. §07 Splash screen ("Armal News" + "News · refined" subline, no spinner)

## What to build

React Native + Expo (managed workflow) app that mirrors the design pack exactly. No new server-side work — `apps/mobile` consumes `/api/feed`, `/api/story/[slug]`, and `/api/categories` from `apps/web`.

### Scaffold and shared imports

- `apps/mobile` Expo managed workflow scaffold; TypeScript; React Native.
- Consumes shared design tokens from `packages/shared/design/tokens` (the TS object branch shipped in slice 0005 — the Tailwind branch is web-only).
- Consumes `packages/shared/constants/categories` for the 9-slug list + icon keys (rendered using the same lucide icons as web).
- Typed API client targeting `apps/web`'s public routes: `getFeed({ category?, cursor?, limit })`, `getStoryBySlug(slug)`, `getCategories()`. Base URL via Expo env (`EXPO_PUBLIC_API_BASE_URL`).

### Screens

- **Onboarding** (§05) — single screen, AsyncStorage-gated key `armal:onboarded`. Shows once per install; tap Continue → mark seen → navigate to feed. Per ADR 0004 § J, this is in-scope despite the original PRD's "no onboarding flow" — it's a splash gate, not a flow.
- **Splash** (§07) — Expo splash screen using the wordmark + "News · refined" subline. No spinner.
- **Feed** (§01–§02) — virtualized list (FlashList) with full-screen vertical paging, one Story per screen, infinite scroll via cursor pagination. Card layout exactly per design: image top half, headline card straddling the seam (transformed `-50%`), italic Newsreader summary centered in the lower half with curly quotes, "Tap to read →" bottom-right.
  - Default chrome (no filter): category icon top-left at low opacity, wordmark top-center at low opacity.
  - Filtered chrome (per ADR 0004 § I): wordmark + dismissible pill stack centered above the headline seam (NOT next to the icon — the icon is replaced).
- **Category bottom sheet** (§03) — ~70% screen height, drag handle, dimmed backdrop, 56px rows, "All stories" first, then the 9 categories. Active row colors icon + name to accent and shows the check.
- **Deep-dive** (§04) — hero image (38%), glass back button overlay, eyebrow + Newsreader 600 headline + italic Newsreader summary + body via `react-native-markdown-display` (JetBrains Mono code blocks), pull quote with 2px accent left-rule when present, tag chips, **accent "View source ↗" pill PLUS a mono `source-host` line directly below it** (per ADR 0004 § L — the host line is mobile-only; deliberate divergence from web).
- **App icon** (§06) — italic Newsreader "A" on warm-paper rounded-square mask. Light + dark adaptive variants. Export at 1024×1024 + auto-generated sizes via `expo-app-icon`.

### Native interactions

- Native share via `expo-sharing` on the deep-dive screen, sharing the canonical `https://…/story/[slug]` URL so recipients see the SSR'd OG preview from slice 0006.
- Source link opens in system browser via `expo-linking` / `WebBrowser.openBrowserAsync`.
- Tapping the wordmark scrolls the FlashList back to index 0 of the current filter.
- Pull-to-refresh on the feed: refreshes from cursor=null. Optional but recommended.

### Theme

- Theme provider: defaults to system color scheme via `useColorScheme()`. Manual toggle (button somewhere in the chrome — minimal placement, not in the design pack so use judgment; suggest a small icon next to the category icon, only visible on long-press or in a settings sheet) persists via `AsyncStorage` key `armal:theme`. Cycles system → light → dark.
- Position memory: scroll position is intentionally NOT remembered across app launches. Cold-launch always lands on story #1 of **All** (per PRD US 15).

### Out of scope for this slice

- App Store / Play Store listings — that's a follow-up after the build is stable. The store URLs from slice 0009 stay placeholders until then.
- Push notifications, deep links into specific Stories from outside the app, share-extension support — all post-MVP.

## Acceptance criteria

- [ ] `pnpm --filter mobile start` runs an Expo dev server; the app loads in Expo Go on iOS and Android.
- [ ] Onboarding screen appears on first launch; tapping Continue persists the gate and lands on the feed. Subsequent launches go straight to the feed.
- [ ] Splash screen matches §07: wordmark + "News · refined" subline, no spinner.
- [ ] Feed screen shows the latest published Stories from the web API; one per screen with vertical paging via FlashList. Card layout matches §01 byte-for-pixel-close.
- [ ] When a category is active, the chrome switches to the filtered layout (§02): wordmark + dismissible pill stacked centered, NOT category icon top-left + pill.
- [ ] Category bottom sheet (§03) — ~70% height, drag handle, dimmed backdrop, "All stories" + 9 categories, active row checkmarked.
- [ ] Deep-dive renders sanitized Markdown with JetBrains Mono code blocks, tags chips, and **the accent source pill + mono source-host line** (the divergence from web is deliberate — confirm both elements are present).
- [ ] Pull quote rendering: when the body uses `> ` with a single paragraph, render with 2px accent left-rule at 17px Newsreader italic.
- [ ] The share button invokes the OS share sheet with the canonical `/story/[slug]` URL; pasting that URL into Slack on a desktop produces the OG preview from slice 0006.
- [ ] Theme cycles system → light → dark; persists via `AsyncStorage`; "system" resyncs live to OS preference.
- [ ] Killing and reopening the app lands on story #1 of **All**.
- [ ] App icon (§06) ships in both light + dark adaptive variants.
- [ ] No new server-side endpoints are added in this slice — the mobile app uses the existing public web API only.

## Blocked by

- Issue 0006 (OG card so share previews work)
- Issue 0007 (cursor pagination contract on `/api/feed`)

# Issue 0009 — Theme provider (OS default + persisted toggle) + desktop PWA install + mobile-UA store banner

**Labels:** needs-triage, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

Cross-cutting reader chrome: theme, install affordance for desktop, store-routing affordance for mobile browsers.

- Web theme provider: defaults to `prefers-color-scheme`; manual toggle (button in the chrome) overrides and persists to `localStorage`. Toggle is reachable on `/` and `/story/[slug]`. Both light and dark modes use the design tokens from `CONTEXT.md`.
- PWA manifest at `apps/web/app/manifest.ts` (or `public/manifest.webmanifest`): name "Armal News", short name, theme color, background color, icons (use the wordmark + "A" placeholder per PRD's Brand mark note — real logo work is post-MVP).
- Desktop install banner: subtle "Install Armal News" prompt in the chrome on desktop browsers that support `beforeinstallprompt`. Dismissed-state persists in `localStorage` so it doesn't nag.
- Mobile-UA detection (server-side via the request headers, OR an early client-side check before the install prompt code runs): on a mobile browser, do NOT offer PWA install — instead, show a banner routing to `https://apps.apple.com/...` (App Store) or `https://play.google.com/...` (Play Store) based on UA. Placeholder URLs are fine until 0010 ships the real app listings; document them as TODOs in the code.
- Theme toggle and the install/store banner integrate cleanly with the snap container from 0007 (don't break scroll-snap).

## Acceptance criteria

- [ ] First load on macOS Safari with system dark mode shows the dark theme without any user action.
- [ ] Toggling theme manually persists across reload and overrides the OS preference until cleared.
- [ ] Desktop Chrome / Edge shows the "Install Armal News" prompt; dismissing it persists across reloads.
- [ ] Installing the PWA on macOS shows "Armal News" in the dock with the wordmark icon.
- [ ] iOS Safari and Android Chrome do NOT show the PWA install prompt; instead, they show a banner routing to the App Store / Play Store URL respectively.
- [ ] Banners and theme toggle are visible on both `/` and `/story/[slug]` and don't break the snap container or the deep-dive layout.
- [ ] The store-banner URLs are placeholders documented as TODOs to be replaced when the apps from 0010 are listed.

## Blocked by

- Issue 0005

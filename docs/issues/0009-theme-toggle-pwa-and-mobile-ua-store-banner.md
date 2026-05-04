# Issue 0009 — Theme provider (OS default + persisted toggle) + desktop PWA install + mobile-UA store banner

**Labels:** needs-triage, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## Design source

Visual contract is locked by [ADR 0004 — design pack v1 is visual source of truth](../adr/0004-design-pack-v1-is-visual-source-of-truth.md), specifically §M (theme toggle placement on desktop).

- [docs/design/components-v1.html](../design/components-v1.html) §09 — theme toggle (sun/moon icon-only pill, light + dark variants) and Install banner ("Install Armal News" with "A" mark icon, one-line pitch, Install CTA, dismiss ✕)
- [docs/design/desktop-pwa-v1-2.html](../design/desktop-pwa-v1-2.html) §04 — install prompt placement (bottom-right floating card on the feed)

## What to build

Wire the theme toggle button placeholder from slice 0007 into a real provider; ship the PWA manifest + install affordance for desktop; route mobile-UA to native app stores.

### Theme provider

- Web theme provider: defaults to `prefers-color-scheme`; the toggle button (placeholder shipped in slice 0007) becomes live this slice and **cycles three states: system → light → dark → system**. Override persists to `localStorage`. Toggle is reachable on `/` and `/story/[slug]` (chrome from 0007 already includes it on `/`; ensure it's also present in the deep-dive header).
- Toggle visual: single icon-button in the chrome's right cluster, between the keyboard-shortcut hint and the Install button (per ADR 0004 § M). Icon shows the *current* mode (sun for light, moon for dark, auto-icon for system); click cycles to the next state.
- Both light and dark themes use the design tokens shipped in slice 0005 (`packages/shared/design/tokens`).
- Avoid FOUC (flash of unstyled content): apply theme class on the `<html>` element before first paint. Standard pattern: a tiny inline script in the document `<head>` reads `localStorage` and sets `data-theme="light"|"dark"` before React hydrates.

### PWA manifest + install banner (desktop)

- `apps/web/src/app/manifest.ts` — name "Armal News", short name "Armal", theme color (`#CC785C`), background color (`#F5F0E8`), icons (use the "A" mark from [mobile-feed-v2-3.html §06](../design/mobile-feed-v2-3.html) — the italic Newsreader "A" on warm-paper rounded badge, exported at 192×192 and 512×512).
- Install affordance — two surfaces:
  1. **Header button** — the "Install app" button already in the desktop chrome from slice 0007. Wire it to `beforeinstallprompt`; if the browser doesn't support PWA install, hide the button.
  2. **Floating prompt card** — bottom-right of the feed, per [desktop-pwa-v1-2.html §04 *Light · install prompt*](../design/desktop-pwa-v1-2.html). Shows the "A" mark icon, "Install Armal News" title, "Add to your dock — no browser chrome, no distractions." subtitle, Install + Not now buttons, dismiss ✕. Surfaces once per session unless dismissed; dismissed-state persists in `localStorage` for ≥30 days.
- Both affordances suppress on mobile UA (see below).

### Mobile-UA store banner

- Server-side UA detection (in middleware or via `headers()`): if iOS, show banner routing to `https://apps.apple.com/...`; if Android, route to `https://play.google.com/...`. Placeholder URLs are fine until slice 0010 ships the real app listings; document them as TODOs in code with a comment pointing at slice 0010.
- Banner visual: same shape as the desktop install banner, different copy ("Open in the Armal News app" / "Better reading on iOS" / etc.) and CTA ("Open" / "Install"). One-tap dismissible; persists for ≥30 days.
- The banner appears on both `/` and `/story/[slug]`. It must NOT break the mobile snap container (slice 0007) or the deep-dive layout (slice 0005). Position: top of the viewport, above the snap container, full-width, ~56px tall.

## Acceptance criteria

- [ ] First load on macOS Safari with system dark mode shows the dark theme without any user action and without FOUC.
- [ ] Theme toggle cycles system → light → dark → system; manual choice persists across reloads; "system" resyncs to OS preference live.
- [ ] Theme toggle button sits in the desktop chrome between the kbd-hint and Install button.
- [ ] Theme toggle is also reachable from the deep-dive page header.
- [ ] Desktop Chrome / Edge with PWA support: header "Install" button works; floating bottom-right prompt also appears once per session unless dismissed.
- [ ] Installing the PWA on macOS shows "Armal News" in the dock with the "A" mark icon.
- [ ] PWA manifest validates (Lighthouse PWA audit passes).
- [ ] iOS Safari and Android Chrome do NOT show any PWA install prompt; instead, they show the store-banner at the top of the viewport.
- [ ] Store-banner URLs are placeholders documented with `TODO(slice-0010)` comments; banner is one-tap dismissible and persists `≥30` days.
- [ ] Mobile-UA banner doesn't break the snap container; theme toggle doesn't break the deep-dive scrollable layout.

## Blocked by

- Issue 0005 (design tokens)
- Issue 0007 (chrome placeholder for the toggle, install button slot)

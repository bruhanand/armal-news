# ADR 0004 — Design pack v1 is the visual source of truth

**Status:** accepted
**Date:** 2026-05-02
**Supersedes (in part):** none
**Amends:** PRD 0001 (specific user stories called out below)

## Context

Slices 0001–0004 built the data-layer spine without visual identity (cards rendered with default browser typography, no chrome, no theme). Slices 0005, 0007, 0008, 0009, 0010 are where visual identity lands.

A complete design pack arrived at `docs/design/`:

- `components-v1.html` — design system (9 components × light/dark + token reference table)
- `desktop-pwa-v1-2.html` — desktop / PWA spec (4 surfaces × 2 themes)
- `mobile-feed-v2-3.html` — React Native spec (7 screens × 2 themes)
- `admin-dashboard-v1-2.html` — admin spec (6 screens, light only)

The pack is implementation-ready (tokens pre-mapped to Tailwind keys, both themes, empty/error states, accent budget rule explicit). It also contradicts the PRD in several places — some doctrinal (vertical-snap on web, status-transition shape, the Settings panels), some smaller (filter pill placement, source CTA divergence).

## Decision

**The design pack at `docs/design/v1/*` is the visual source of truth.** Where the pack and the PRD conflict, the pack wins; the PRD is amended.

Specific amendments arising from the pack are catalogued below so future sessions don't relitigate them.

### A. Desktop feed is a 2-column scrollable grid, not vertical-snap

**Amends PRD US 3.** The original *"same vertical-snap behavior in the browser as on mobile"* is replaced with: vertical-snap is mobile + mobile-web. Desktop / PWA at `≥1280px` is a two-column scrollable grid with explicit "Read more →" CTAs. Rationale: TikTok-style snap is a thumb-and-phone gesture; on a 27″ monitor it inverts (mouse wheel ≠ swipe, idle hover state breaks rhythm). The pack's slim-header + grid pattern matches reading patterns on news aggregators (Apple News web, Flipboard web, Hacker News).

### B. Status transitions expand to allow Un-publish and Restore-to-draft

**Amends PRD § "Schema invariants"** and the slice 0008 transition guard.

New legal transitions:

- `draft → published`
- `draft → rejected`
- `published → published` (in-place edit — slug + `published_at` unchanged)
- `published → draft` (Un-publish — `published_at` cleared)
- `rejected → draft` (Restore from Rejected list)

Knowingly accepted trade-off: **un-publish breaks share-stable URLs.** A reader who Slacks `/story/<slug>` before un-publish gets a 404 after. The original PRD privileged stable URLs over reversibility; the design favors reversibility, and the admin gets the recovery path it shows in the mockup. The transition guard (slice 0008) enforces the new matrix; everything else is illegal.

### C. Schema additions implied by the admin pack

- `stories.reject_reason text nullable` — populated when admin clicks Reject; shown in the Rejected list ("Unverified claim", "Out of scope", "Duplicate" are sample values, not an enum).
- `stories.body_markdown` is sanitized at render time (admin Preview tab + public deep-dive) through the same `markdown-sanitize` shared util — single contract, both surfaces.
- New `admin_settings` key/value table — single-row config used by the Settings page (ingestion, auth-stub, category-runtime overrides). Schema lands in slice 0008 alongside the Settings UI.
- Categories: `name` and `sort_order` become admin-mutable; `slug` stays immutable (locked in code, validated against the seed list at ingest). `constants/categories.ts` is demoted from "single source of truth" to "initial seed values; runtime mutable thereafter." See § F.

### D. Admin search is in scope for slice 0008

`ILIKE` over title + summary on each list (drafts / published / rejected). Plain SQL, no full-text index — fine at MVP volume. Adds `?q=` to the existing list query helpers.

### E. Markdown Edit / Preview tabs in the admin draft detail editor

Preview renders the body through `markdown-sanitize` — i.e. the admin sees what readers will see, not the raw markdown. The shared sanitizer ensures admin preview ≡ public render byte-for-byte.

### F. Categories are runtime-mutable for `name` + `sort_order`; `slug` stays locked

`constants/categories.ts` is the seed. The seed migration in slice 0004 still upserts it on bootstrap. After bootstrap, the admin Settings page can edit `name` and `sort_order` on any category; those changes persist to the `categories` table.

`slug` is never editable (admin or otherwise). The validator continues to enforce the slug enum at ingest. The seed migration uses `ON CONFLICT (slug) DO NOTHING` (changed from the slice-0004 `ON CONFLICT DO UPDATE` so admin name overrides aren't clobbered on re-seed).

### G. Save-indicator pattern in admin

"Saved 12s ago" indicator is **not** autosave; it's last-saved-at, tied to the manual Save button. Admin keeps explicit saves for an internal-only tool — autosave + drafts-of-drafts is unnecessary complexity.

### H. Status tabs in the admin header coexist with the sidebar nav

Both surfaces show Drafts / Published / Rejected with counts. This is deliberate redundancy from the design — sidebar is persistent navigation; header tabs are a within-screen filter affordance. Don't dedupe.

### I. Mobile filter pill is centered under the wordmark

**Amends PRD US 10.** The original *"dismissible pill ✕ next to the category icon"* is replaced with: when a category is active, the wordmark + dismissible pill stack centered above the headline seam. The category-icon-top-left overlay is replaced by the centered stack on filtered states.

### J. Mobile onboarding is a single-screen splash gate

In-scope for slice 0010, against the original PRD's "no onboarding flow" — the screen is a single tap-through ("A" mark, wordmark, lede, Continue), AsyncStorage-gated so it shows once per install. Not a "flow" — closer to a splash with an action.

### K. Desktop keyboard shortcuts (J/K, Space, C, ⌥K, Esc, ⌥↵)

In-scope for slice 0007. Adds a `shortcuts` modal triggered by `⌥K`. Shortcuts wire to the existing feed/deep-dive interactions:

| Key | Action |
|-----|--------|
| `J` / `↓` | Next story (advance feed) |
| `K` / `↑` | Previous story |
| `↵` / `Space` | Open article (navigate to `/story/[slug]`) |
| `Esc` | Close / back |
| `C` | Open category dropdown |
| `⌥C` | Clear filter |
| `⌥↵` | Open source link in a new tab |
| `⌥K` | Show shortcuts panel |

### L. Source CTA — mobile shows host, desktop does not (deliberate divergence)

Mobile deep-dive: accent pill ("View source ↗") + mono `source-host` line below it ("anthropic.com / research / circuits-2026"). Desktop deep-dive: accent pill only. Rationale: desktop browsers reveal the destination URL on hover via the status bar; mobile browsers do not. Showing the host on mobile is a trust preview that desktop doesn't need.

Surveyed pattern across Apple News, Pocket, Flipboard, Hacker News, iOS Safari Reader, Smartnews — host displayed in attribution context plus a prominent outbound CTA at the bottom is the dominant pattern; mobile-vs-desktop divergence on the host line tracks the platform's URL-preview affordance. Locked in; do not "fix" the inconsistency in a future slice.

### M. Desktop theme toggle placement

Top-right cluster, between the keyboard-shortcut hint and the Install button. Single icon-button (cycles light → dark → system on click), not the 2-state pill from the components sheet, because the system covers three states (OS-default + two manual overrides) and a single button is the smallest control that fits three.

### N. OG share card — design described inline (slice 0006)

The pack does not include a 1200×630 OG card. Slice 0006 builds a dynamic per-Story OG card via Next.js `opengraph-image.tsx`. Visual contract:

- **Full-bleed Story image** as background.
- **Warm-paper gradient overlay** on the bottom 55% (transparent → `#F5F0E8` at 92% opacity) to guarantee text contrast against any image.
- **Wordmark** "Armal News" italic Newsreader top-left, low-opacity warm-paper tint.
- **Category eyebrow** (mono caps + accent dot) in the lower-third.
- **Title** Newsreader 600, balanced, max 2 lines, ink color.
- **Italic summary** Newsreader italic with curly quotes, max 2 lines, muted.
- **"A" mark** italic Newsreader on a warm-paper rounded badge, bottom-right.
- Light palette only — OG cards render outside any theme context.

A static HTML mockup at `docs/design/og-card-v1.html` accompanies this ADR so the slice-0006 builder works from a visual contract rather than text alone.

### O. Settings → Ingestion is a remote-control plane, not an in-process poller

**Amends architecture.** The admin app does NOT poll RSS feeds itself. The Settings → Ingestion panel writes config (poll interval, RSS URLs, auto-draft threshold) to `admin_settings`; OpenClaw (running on the admin's Linux laptop) reads that config via a config-sync protocol over Tailscale. The admin app is the control surface; OpenClaw is the runtime.

The config-sync protocol gets its own slice (issue 0011) — it is NOT in slice 0008. Slice 0008 ships only the Settings UI + the `admin_settings` table; OpenClaw integration ships in 0011.

This preserves ADR-0003 (admin app stays a thin tool on Tailscale; OpenClaw runs externally; no serverless RSS-polling background workers in the Next.js admin).

**Amendment (slice 0011, 2026-05-23):** the sync direction is **OpenClaw → Admin pull** (issue 0011 Option A), not Admin → OpenClaw push. OpenClaw polls `GET /api/admin/openclaw/config` every ~30s; the response carries the current ingestion config + a `version` (the row's `updated_at`) so OpenClaw can no-op when nothing changed. Up to ~30s of save-to-apply staleness is the accepted trade-off; in return there is no Admin → OpenClaw wiring, no retry logic on push, and the admin app never speaks first. Full contract: `docs/openclaw-contract.md`.

### P. Settings → Auth is a UI stub for the post-Tailscale migration

**Honors ADR-0003.** Auth panel renders the design's email + session-timeout fields with a banner: *"Active when admin moves off Tailscale (ADR-0003 migration trigger)."* Inputs save to `admin_settings`; nothing reads from them. When ADR-0003's migration trigger fires (admin moves off Tailscale + auth provider gets bolted on), this panel becomes live.

No auth provider (NextAuth / Clerk / Lucia / Better-Auth) gets pulled in for MVP. Tailscale is still the security boundary.

## Consequences

**Positive**

- The pack is the contract. Builder sessions implement straight from the HTML mockups + this ADR, not from prose.
- The PRD remains the product brief; this ADR records the deltas. PRD 0001 is not edited — readers cross-reference via the "Amends" bullets here.
- Admin reversibility (Un-publish / Restore) is gained at the cost of share-URL stability, knowingly.
- `constants/categories.ts` semantics simplify: it's the seed, not the runtime list. The runtime list lives in the DB, editable by the admin.
- The OpenClaw architecture stays clean: admin is control surface, OpenClaw is runtime. The Settings page is a remote control, not a re-implementation.

**Negative / risks**

- A reader who shares a `/story/<slug>` URL before the admin un-publishes hits 404. Mitigation: the admin shouldn't un-publish casually; surface a confirm dialog mentioning shared-URL impact.
- The seed migration's `ON CONFLICT (slug) DO NOTHING` means renaming a category in the constants file no longer propagates to existing DBs (admin overrides win). New categories still upsert as expected. Workflow: rename the constants file when adding a new category; don't expect rename-in-the-file to flow to staging/prod.
- Slice 0011 (OpenClaw remote-control protocol) becomes a prerequisite for the Settings → Ingestion panel to actually do anything. The UI in 0008 ships, but it's inert until 0011 lands. This is acceptable — same pattern as the Auth stub.

## Implementation pointers

- New schema columns and the `admin_settings` table: slice 0008's migration.
- Status-transition guard expansion: slice 0008's `validation/story.ts` `StatusTransition` rule.
- OpenClaw config-sync protocol: new issue 0011.
- OG card mockup: `docs/design/og-card-v1.html` (writes alongside this ADR).
- Settings panel: slice 0008 owns Drafts / Published / Rejected / Categories panels (live); slice 0008 also ships Auth + Ingestion as UI stubs (the Ingestion stub becomes live when 0011 lands).

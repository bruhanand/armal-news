# Issue 0006 — Open Graph metadata + dynamic per-Story OG image

**Labels:** needs-triage, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## Design source

Visual contract is locked by [ADR 0004 — design pack v1 is visual source of truth](../adr/0004-design-pack-v1-is-visual-source-of-truth.md) §N and the dedicated mockup:

- [docs/design/og-card-v1.html](../design/og-card-v1.html) — full layout, anatomy, spec table, in-context Slack/iMessage previews, and rules. Match it exactly.

## What to build

Make a pasted Story URL produce a rich preview card in iMessage, Twitter, WhatsApp, Slack — rendered from the per-Story OG card defined in `og-card-v1.html`.

- `apps/web/src/app/story/[slug]/opengraph-image.tsx` — Next.js route-segment OG image generator using `@vercel/og` (Satori). Renders the `og-card-v1.html` layout server-side per request from Story fields: full-bleed `image_url`, warm-paper scrim on bottom 55%, italic Newsreader wordmark top-left at 78% opacity, mono accent-dot eyebrow with category name in the lower-third, Newsreader 600 title (max 2 lines, balanced wrap), italic Newsreader deck with curly quotes (max 2 lines), warm-paper "A" mark badge bottom-right.
- `apps/web/src/app/story/[slug]/page.tsx` exports `generateMetadata` returning OG (`og:title` from title, `og:description` from `short_summary`, `og:image` pointing at the route-segment OG, `og:type=article`, `og:url`) and Twitter card metadata (`twitter:card=summary_large_image` + the same image). The HTML title tag also reflects the Story title.
- Same RSC SSR path as 0005 — first byte already includes the metadata; no client-side hydration needed for crawlers to see it.
- Light palette only (per ADR 0004 § N — no dark variant; chat clients render OG cards on their own background).
- Single template, no exceptions — no alternate layouts for breaking news, no variant cards.
- Manual verification: paste a real published Story URL into Slack, iMessage, Twitter, WhatsApp; confirm the card renders. Capture screenshots in the PR description.

## Acceptance criteria

- [ ] `view-source:/story/[slug]` shows `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, `<meta property="og:type">`, `<meta property="og:url">`, and Twitter equivalents on first byte (no client JS).
- [ ] `og:image` points at `/story/[slug]/opengraph-image` (the route-segment generator) for that specific slug.
- [ ] Hitting the OG image URL returns a 1200×630 PNG rendered from the Story's image, title, and short summary, matching `og-card-v1.html` byte-for-pixel-close: scrim, type, accent dot, "A" mark all present and positioned per the spec table in §04 of the mockup.
- [ ] Title overflow truncates with ellipsis at 2 lines; type does NOT shrink to fit (per ADR 0004 § N rules).
- [ ] Deck overflow truncates with ellipsis at 2 lines.
- [ ] Pasting a published Story URL into Slack produces a rich preview card with image, title, short summary; iMessage shows the rich link with the OG card as the thumbnail and `armal.news` as the host (manual check; screenshots in PR).
- [ ] Hitting `/story/[slug]` for a non-published Story returns 404; OG metadata is not generated; the OG image route returns 404 too.
- [ ] OG card renders in light palette regardless of viewer's theme — never dark.

## Blocked by

- Issue 0005

---

**Status:** Shipped via Sandcastle on 2026-05-23. Merge commit: bf82a70.

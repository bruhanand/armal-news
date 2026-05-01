# Issue 0006 — Open Graph metadata + dynamic per-Story OG image

**Labels:** needs-triage, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

Make a pasted Story URL produce a rich preview card in iMessage, Twitter, WhatsApp, Slack — without authoring OG cards by hand.

- `apps/web/app/story/[slug]/opengraph-image.tsx` — Next.js route-segment OG image generator. Renders dynamically from Story fields: image as the background, title overlaid, short summary as a sub-line. Matches the brand (Newsreader for the title, warm-paper background variants).
- `apps/web/app/story/[slug]/page.tsx` exports `generateMetadata` returning OG (`og:title` from title, `og:description` from `short_summary`, `og:image` pointing at the route-segment OG, `og:type=article`, `og:url`) and Twitter card metadata. Title tag also reflects the Story.
- Same RSC SSR path as 0005 — first byte already includes the metadata; no client-side hydration needed for crawlers to see it.
- Manual verification only (no automated test): paste a real published Story URL into Slack, iMessage, Twitter, WhatsApp; confirm the card renders.

## Acceptance criteria

- [ ] `view-source:/story/[slug]` shows `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, and Twitter equivalents on first byte (no client JS needed).
- [ ] `og:image` points at the dynamic `opengraph-image.tsx` route segment for that slug.
- [ ] Hitting that OG image URL returns a 1200×630-ish PNG/JPEG rendered from the Story's image, title, and short summary.
- [ ] Pasting a published Story URL into Slack and iMessage produces a rich preview card with image, title, short summary (manual check, screenshot in PR).
- [ ] Hitting `/story/[slug]` for a non-published Story returns 404; OG metadata is not generated.

## Blocked by

- Issue 0005

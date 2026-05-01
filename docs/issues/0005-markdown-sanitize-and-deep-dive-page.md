# Issue 0005 — Markdown sanitization + styled deep-dive page with tags and source-link footer

**Labels:** needs-triage, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

Sanitize body markdown at write time and ship the real reader deep-dive page.

- `packages/shared/lib/markdown-sanitize` — pure function: CommonMark in, sanitized CommonMark (or sanitized HTML, whichever the renderer wants) out. Allow-list of safe HTML, capped heading depth, no raw `<script>` / `<iframe>` / event handlers / `javascript:` URLs. Snapshot tests covering a curated set of malicious + benign inputs (the snapshot IS the contract per the PRD's testing decisions).
- Ingest pipeline calls `markdown-sanitize` on `body_markdown` before persisting (between zod validation and DB upsert; image-fetch step from 0003 is unchanged).
- `apps/web` `/story/[slug]` is the styled SSR'd deep-dive: image on top, then title, then full article body rendered from sanitized Markdown, then the Story's tags surfaced as visible chips (no filter — display only), then a clear "View source ↗" link to `source_link` at the bottom.
- Code blocks inside the rendered article use **JetBrains Mono**; prose uses the design tokens from `CONTEXT.md` (Newsreader for headings, body face for prose).
- Web feed card → tap → `/story/[slug]` (replaces the unstyled fallback from 0002). Adds the "Tap to read →" affordance bottom-right of the card if it isn't already there.
- `db/queries.getPublishedStoryBySlug(slug)` returns 404-equivalent (null) for `draft` / `rejected`; repository test covers this.

## Acceptance criteria

- [ ] `markdown-sanitize` strips `<script>`, `<iframe>`, inline event handlers, and `javascript:` URLs; passes the snapshot suite.
- [ ] Posting an ingest batch with a malicious body persists sanitized markdown; the deep-dive renders no executable script.
- [ ] `/story/[slug]` lays out image → title → body → tags → "View source ↗" footer linking to `source_link`.
- [ ] Code blocks inside rendered articles are JetBrains Mono.
- [ ] `getPublishedStoryBySlug` returns null for `draft` and `rejected` rows; the page returns 404.
- [ ] The feed card "Tap to read →" affordance is bottom-right and navigates to `/story/[slug]`.
- [ ] Tags are visible on the deep-dive but are NOT clickable (no tag filter in MVP).

## Blocked by

- Issue 0004

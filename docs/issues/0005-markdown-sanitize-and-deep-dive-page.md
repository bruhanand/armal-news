# Issue 0005 — Markdown sanitization + styled deep-dive page with tags and source-link footer

**Labels:** ready-for-agent, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## Design source

Visual contract is locked by [ADR 0004 — design pack v1 is visual source of truth](../adr/0004-design-pack-v1-is-visual-source-of-truth.md). Implement directly from:

- [docs/design/desktop-pwa-v1-2.html](../design/desktop-pwa-v1-2.html) §03 *Deep-dive article* — desktop layout (680px reading column, hero, eyebrow, h1, italic deck, body, pull quote with accent rule, tag chips, accent "View source ↗" pill, back-to-feed in header)
- [docs/design/mobile-feed-v2-3.html](../design/mobile-feed-v2-3.html) §04 *Deep-dive article* — mobile layout (38% hero, glass back button, eyebrow + h1 + italic summary + body + pull quote + tag chips + accent source pill + mono `source-host` line below)
- [docs/design/components-v1.html](../design/components-v1.html) — pull quote (§06), tag chip (§04) and tokens (§10)

## Tags column lands here

Per ADR 0004, slice 0004 deferred the `tags text[] not null default '{}'` column. This slice owns the migration, the ingest persistence (validator already accepts `tags`), and the deep-dive chip rendering.

## What to build

Sanitize body markdown at write time and ship the real reader deep-dive page that mirrors the design pack.

- Schema migration: add `stories.tags text[] not null default '{}'`. Ingest persists the validated `tags` array; the prior slices accepted but ignored it.
- `packages/shared/src/lib/markdown-sanitize` — pure function: CommonMark in, sanitized output (CommonMark or sanitized HTML — pick the form the renderer wants and document the choice). Allow-list of safe HTML, capped heading depth, no raw `<script>` / `<iframe>` / event handlers / `javascript:` URLs. Snapshot tests covering a curated set of malicious + benign inputs (the snapshot IS the contract per the PRD's testing decisions).
- Ingest pipeline calls `markdown-sanitize` on `body_markdown` before persisting (between zod validation and DB upsert; image-fetch step from 0003 is unchanged).
- `apps/web/src/app/story/[slug]/page.tsx` — styled SSR'd deep-dive matching the desktop design exactly: 680px reading column, hero image, mono eyebrow with accent dot, Newsreader 600 headline, italic Newsreader deck, sanitized body, optional pull quote with 2px accent left-rule, tag chips (mono, display-only — no filter), accent "View source ↗" pill at the bottom of the article. Code blocks render in JetBrains Mono.
- The page is responsive: at mobile viewports, render the mobile design's deep-dive instead — collapsed hero (38%), glass back button overlay, accent source pill PLUS a mono `source-host` line directly below it (per ADR 0004 § L — the divergence is deliberate; do not unify).
- Web feed card → tap → `/story/[slug]` (replaces the unstyled fallback from 0002). The card layout itself stays as-is in this slice; full feed chrome arrives in 0007.
- `db/queries.getPublishedStoryBySlug(slug)` returns null for `draft` / `rejected`; repository test covers this.
- Wire `packages/shared/design/tokens` (CSS variables emitted as Tailwind config + a TS object for RN). The token table at [components-v1.html](../design/components-v1.html) §10 is the source. Tailwind keys are pre-mapped (`bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `text-accent`, `border-border`, `font-display`, `font-body`, `font-mono`, `rounded-card`, `rounded-sheet`, `rounded-full`, `shadow-card`, `shadow-sheet`, `shadow-drop`).
- Both light + dark themes. Theme detection is OS-default for this slice (the manual toggle lands in 0009); use `prefers-color-scheme` media query.

## Acceptance criteria

- [ ] `markdown-sanitize` strips `<script>`, `<iframe>`, inline event handlers, and `javascript:` URLs; passes the snapshot suite.
- [ ] Posting an ingest batch with a malicious body persists sanitized markdown; the deep-dive renders no executable script.
- [ ] `tags` column added; ingest writes the validated `tags` array; existing rows backfill to `'{}'` cleanly.
- [ ] Desktop `/story/[slug]` (≥1024px) lays out the 680px reading column exactly per design: hero → eyebrow + accent dot → Newsreader 600 headline → italic deck → body (sanitized) → optional pull quote → tag chips → accent source pill at bottom.
- [ ] Mobile `/story/[slug]` (<768px) renders the mobile design: 38% hero, glass back button, body, tags chips, **accent source pill PLUS a mono `source-host` line below it** (intentional divergence — see ADR 0004 § L).
- [ ] Code blocks inside rendered articles are JetBrains Mono.
- [ ] Pull quote rendering: when the body uses `> ` blockquote syntax with a single paragraph, render with 2px accent left-rule at 17–20px Newsreader italic. Use at most once per article (visual rule, not enforced).
- [ ] Both light + dark variants render correctly via `prefers-color-scheme`. Manual theme toggle is NOT in this slice.
- [ ] `getPublishedStoryBySlug` returns null for `draft` and `rejected` rows; the page returns 404.
- [ ] The feed card → deep-dive link works (chrome on the card itself lands in 0007).
- [ ] Tags are visible on the deep-dive but are NOT clickable (no tag filter in MVP).
- [ ] Design tokens land in `packages/shared/design/tokens` and are consumed by both web (Tailwind) and the deep-dive page.

## Blocked by

- Issue 0004

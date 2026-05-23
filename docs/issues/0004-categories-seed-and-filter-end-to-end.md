# Issue 0004 — Categories: 9-seed migration, story_categories join, ingest validation, feed filter, web bottom sheet

**Labels:** ready-for-agent, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

Categories cut through every layer at once: seed table, join table, ingest validation, feed filter, admin re-pick UI, reader bottom sheet + dismissible pill. Tag column also lands here on the row (used later in 0005's deep-dive).

- `packages/shared/constants/categories` — single source of truth for the nine seeded entries: `ai-in-tech`, `ai-in-finance`, `ai-in-healthcare`, `ai-in-robotics`, `ai-in-cooking`, `ai-in-education`, `ai-research`, `ai-tools`, `ai-policy-safety`. Each has `slug`, `name`, `iconKey`, `sort_order`.
- Drizzle schema: `categories` (id, slug unique, name, sort_order) and `story_categories` join (story_id, category_id, composite PK). Seed migration that upserts the nine on every fresh-DB bootstrap, importing from `constants/categories`.
- Add `tags text[] not null default '{}'` to `stories`.
- `validation/story` — tighten `category_slugs` to require ≥1 entry, each one matching a seeded slug. Vitest covers the must-be-in-seeded-list rule.
- Ingest pipeline — for each Story, write its `story_categories` rows (replace-on-upsert by `external_id`).
- `db/queries.listPublishedStories({ category?, cursor?, limit })` filters by category slug via the join; returns Stories ordered by `published_at DESC`. Repository test against a local Postgres asserts a multi-category Story surfaces under each of its categories.
- `apps/web` `/api/feed?category=` honors the filter; `/api/categories` lists the nine.
- Web `/`: category icon overlay top-left at low opacity; tap opens a bottom sheet listing **All** + the nine categories; tapping one closes the sheet and reloads the feed filtered to that category from story #1; the active selection appears as a dismissible pill (e.g., "AI in Tech ✕") next to the icon. **All** is the default and shows every published Story in reverse chronological order.
- `apps/admin` draft detail: multi-select for categories (the nine), persisted via the existing edit endpoint.

## Acceptance criteria

- [ ] Fresh DB bootstrap leaves exactly nine rows in `categories` matching `constants/categories`.
- [ ] Posting an ingest batch with `category_slugs: []` or with an unseeded slug rejects the whole Story (and per slice 0002 rules, reports it in the per-index error report).
- [ ] A Story tagged with two categories appears under each category's filter and under **All**.
- [ ] `/api/feed?category=ai-in-robotics` returns only Stories with that join row, ordered by `published_at DESC`.
- [ ] Tapping the category icon on `/` opens the bottom sheet; tapping a category closes the sheet and the feed reloads filtered from story #1.
- [ ] The active category appears as a dismissible pill; dismissing it returns to **All**.
- [ ] Admin draft detail can change a draft's categories; reload reflects the new set.
- [ ] Repository test for `listPublishedStories` covers: status filter, category filter, ordering, multi-category surfacing.

## Blocked by

- Issue 0003

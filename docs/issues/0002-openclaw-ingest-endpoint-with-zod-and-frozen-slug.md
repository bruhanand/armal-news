# Issue 0002 — OpenClaw ingest endpoint with zod batch validation and frozen slug

**Labels:** ready-for-agent, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

Replace the dev seed route with the real `POST /api/ingest/stories` that OpenClaw will call over Tailscale. Adds idempotency on `external_id` and the immutable slug invariant. No image pipeline, no markdown sanitization, no categories yet — those land in slices 0003, 0005, and 0004 respectively.

- Schema migration: add `external_id text unique not null`, `slug text unique not null` to `stories`. The slug is assigned at draft-creation time and never rewritten.
- `packages/shared/lib/slugify` — pure function: title → URL-safe slug, collisions append `-2`, `-3`, …. Vitest unit tests for ASCII, unicode, length cap, and collision behavior.
- `packages/shared/validation/story` — zod `IngestStoryV1` schema covering `external_id`, `title`, `short_summary`, `body_markdown`, `image_url`, `source_link`, `tags: string[]`, `category_slugs: string[]` (still validated as non-empty array of strings; the seeded-list constraint lands in 0004). Vitest tests on accept/reject cases.
- `apps/admin` `POST /api/ingest/stories`: zod-validate the full batch envelope `{ stories: IngestStoryV1[] }`; reject the **whole** batch on any per-Story validation failure with a useful per-index error report. For each accepted Story, upsert by `external_id` (insert if new, update mutable fields if known); on insert, generate a fresh slug from the title and freeze it; on update, never touch `slug`. Always set `status='draft'` regardless of payload.
- Rip out the `POST /api/dev/seed-one` route from slice 0001.
- `apps/web` `GET /api/story/[slug]` returning a published Story by slug (404 if `status != 'published'`).
- Web `/story/[slug]` page (unstyled — same body shown on `/` is fine for now); admin Publish flow continues to work and the resulting URL uses the slug.

## Acceptance criteria

- [ ] Posting a valid batch of N Stories yields N `draft` rows.
- [ ] Re-posting the same batch yields N rows still (idempotent on `external_id`); mutable fields update, slugs do NOT change.
- [ ] Posting a batch where one Story is invalid yields zero rows and a per-index error report; the rest of the batch is rejected.
- [ ] Slug collisions on different Stories with the same title resolve as `foo`, `foo-2`, `foo-3`.
- [ ] Editing a draft's title via the admin (carry forward whatever inline edit exists from 0001 or stub one) does NOT change the slug.
- [ ] After Publish, `GET /api/story/[slug]` returns the Story; reloading `/story/[slug]` on the web app renders it.
- [ ] `slugify` and `validation/story` ship with passing Vitest tests.

## Blocked by

- Issue 0001

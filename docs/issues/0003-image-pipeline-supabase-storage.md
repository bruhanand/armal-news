# Issue 0003 — Image pipeline: ingest fetches → Supabase Storage → CDN URL on row

**Labels:** ready-for-agent, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

End the dependency on whichever upstream URL OpenClaw scraped. The ingest pipeline downloads each Story's referenced image, uploads it as-is to a Supabase Storage bucket, and persists the resulting CDN URL on `image_url`. The web feed card renders that image.

- Provision a `story-images` Supabase Storage bucket (public read). Document the bucket name + the env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in `.env.example`. Bucket creation is a one-time admin task; document it in the README rather than scripting it.
- Storage client wired into `apps/admin` only (the service-role key never leaves the admin process).
- Ingest pipeline step (between zod validation and DB upsert): for each accepted Story, fetch `image_url`, upload to `story-images/{external_id}.{ext}` with the original content-type, replace `image_url` on the row with the resulting public CDN URL. On image-fetch / upload failure, the entire Story (not the batch) fails and is reported back in the per-index error report from 0002.
- `image_url` becomes `not null` on the `stories` table (per US 26 — every Story must have an image).
- Web feed card and `/story/[slug]` render the image (basic — `<img>` or `next/image` is fine; visual polish lands in 0007).
- Vitest test for the ingest orchestration with a mocked Storage client: a valid batch yields N rows whose `image_url` points at the bucket; a Story whose image 404s is rejected without poisoning the rest of the batch.

## Acceptance criteria

- [ ] Posting an ingest batch results in `image_url` values pointing at the Supabase Storage CDN, not at the upstream source.
- [ ] The `story-images` bucket contains the uploaded files keyed by `external_id`.
- [ ] A batch where one Story's image fails to fetch reports that Story in the per-index error report and inserts the rest.
- [ ] `image_url` is `not null` in the schema; the migration for that constraint is additive and safe to apply.
- [ ] Web feed and deep-dive both render the stored image.
- [ ] Ingest orchestration test passes against a mocked Storage client.

## Blocked by

- Issue 0002

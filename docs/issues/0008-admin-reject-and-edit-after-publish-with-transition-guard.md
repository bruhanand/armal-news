# Issue 0008 — Admin reject (soft-delete) + edit-after-publish + status-transition guard

**Labels:** needs-triage, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

Round out the admin write path: soft-delete via Reject, allow typo-fixes after publish (slug pinned), and centralize the legal status transitions behind a tested guard.

- `packages/shared/validation/story` — `StatusTransition` guard: pure function `(from, to) => Result`. Legal transitions: `draft → published`, `draft → rejected`, `published → published` (in-place edit, no-op on status). Everything else is rejected with a useful error. Vitest unit tests cover the full transition matrix.
- `apps/admin` `POST /api/admin/stories/[id]/reject` — flips `status` to `rejected` (soft-delete, row retained for audit), removes the row from the drafts queue.
- `apps/admin` `PATCH /api/admin/stories/[id]` — already exists for drafts; extend to accept edits on `published` rows. `slug` is never editable. `published_at` is never cleared. `status` field on the patch body is ignored — status changes go through the dedicated endpoints.
- `apps/admin` `POST /api/admin/stories/[id]/publish` from earlier slices — refactor to delegate to `StatusTransition`; add a no-op-if-already-published behavior with `published_at` only stamped on first transition.
- Admin draft detail UI: Reject button alongside Publish; confirmation dialog for Reject (low-friction — single click → confirm).
- Admin published-stories view (or a "show all" toggle on the queue) so the admin can find a published Story to edit. Doesn't need to be elaborate — a simple table with a status filter is fine.
- Reader-facing surfaces (feed, deep-dive, OG, API) continue to filter strictly to `status='published'`. Add a regression test on `listPublishedStories` and `getPublishedStoryBySlug` confirming `rejected` rows never leak.

## Acceptance criteria

- [ ] `StatusTransition` accepts `draft → published`, `draft → rejected`, `published → published`; rejects every other transition. Vitest covers the matrix.
- [ ] Reject endpoint flips a draft to `rejected`; the row stays in the DB; the drafts queue no longer shows it.
- [ ] A `rejected` Story does not appear in `/api/feed`, `/api/story/[slug]`, the web feed, or the deep-dive page.
- [ ] Editing a `published` Story via the PATCH endpoint succeeds; `slug` and `published_at` are unchanged in the DB regardless of patch body.
- [ ] The admin can locate a published Story (via the new view / toggle) and edit it.
- [ ] Re-publishing an already-`published` Story is a no-op (does not re-stamp `published_at`).
- [ ] Repository tests confirm `rejected` rows are filtered out of every reader-facing query.

## Blocked by

- Issue 0004

# Issue 0008 — Admin v1: full dashboard, expanded transition guard, settings stubs

**Labels:** ready-for-agent, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## Design source

Visual contract is locked by [ADR 0004 — design pack v1 is visual source of truth](../adr/0004-design-pack-v1-is-visual-source-of-truth.md), specifically §B (status transitions expand), §C (schema additions), §D (admin search), §E (Markdown Edit/Preview tabs), §F (categories runtime-mutable), §G (save-indicator pattern), §H (status tabs + sidebar coexist), §O (Ingestion as remote-control stub), §P (Auth as UI stub).

- [docs/design/admin-dashboard-v1-2.html](../design/admin-dashboard-v1-2.html) §01–§06 — drafts queue, draft detail editor, extra states (empty / reject confirm / toasts / validation), published list, rejected list, settings page
- [docs/design/components-v1.html](../design/components-v1.html) — buttons (§01), badges (§02), category pill (§03), tag chip (§04), admin table row (§08)

## What to build

This slice ships the admin dashboard at parity with the design pack. It's bigger than the original scope because the design pack added: Un-publish + Restore-to-draft, `reject_reason` column, admin search, Markdown Edit/Preview, runtime-mutable categories, the Save-indicator pattern, and the Settings page.

### Schema migration

Generate one Drizzle migration adding:

- `stories.reject_reason text nullable` — captured at rejection time. No enum; freeform.
- `admin_settings (key text primary key, value jsonb not null, updated_at timestamptz default now())` — single-row config table. Used by the Settings page (Categories overrides, Auth stub, Ingestion stub).
- No new column on `categories`; `name` and `sort_order` on the existing table become admin-mutable in code.

Update the slice-0004 seed migration's `ON CONFLICT (slug) DO UPDATE` → `ON CONFLICT (slug) DO NOTHING` so admin name overrides aren't clobbered on re-seed (per ADR 0004 § F).

### Status transition guard (expanded)

`packages/shared/src/validation/story.ts` — `StatusTransition` pure function. Per ADR 0004 § B, the legal matrix is now:

| From | To | Allowed? | Side-effect |
|------|----|----------|-------------|
| draft | published | ✅ | stamp `published_at` |
| draft | rejected | ✅ | stamp `reject_reason` if provided |
| published | published | ✅ | in-place edit (no status change side-effect) |
| **published** | **draft** | **✅ (NEW — Un-publish)** | **clear `published_at`** |
| **rejected** | **draft** | **✅ (NEW — Restore)** | **clear `reject_reason`** |
| anything else | anything else | ❌ | reject with useful error |

Vitest unit tests cover the full matrix. **Knowingly accepted trade-off documented in ADR 0004:** un-publish breaks share-stable URLs.

### Admin endpoints

- `POST /api/admin/stories/[id]/publish` — delegates to `StatusTransition`. No-op if already `published`. Stamps `published_at` only on first `draft → published`.
- `POST /api/admin/stories/[id]/reject` — accepts `{ reason?: string }` body. Flips to `rejected`; persists `reject_reason`.
- `POST /api/admin/stories/[id]/unpublish` — NEW. Flips `published → draft`. Clears `published_at`. Surface a confirmation dialog mentioning shared-URL impact.
- `POST /api/admin/stories/[id]/restore` — NEW. Flips `rejected → draft`. Clears `reject_reason`.
- `POST /api/admin/stories/[id]/delete` — NEW. Hard delete from Rejected list (the design's "Delete" action). Removes the row + the Storage object.
- `PATCH /api/admin/stories/[id]` — accepts edits on `draft` and `published` rows. `slug`, `external_id`, `published_at`, `status` ignored on the patch body. Status changes go through the dedicated endpoints.
- `PATCH /api/admin/categories/[id]` — NEW. Allows updating `name` and `sort_order`. `slug` rejected with 400.
- `PATCH /api/admin/settings/[key]` — NEW. Upserts a key into `admin_settings`. Used by the Settings page.

### Admin UI — port the design pack

Implement each of the six screens in `admin-dashboard-v1-2.html`:

1. **Drafts queue (`/`)** — sidebar (Drafts/Published/Rejected counts + Settings), header with search + status tabs, table (thumb, title+excerpt, categories, ingest time, inline Publish + Reject). Status tabs and sidebar coexist deliberately (per ADR 0004 § H — don't dedupe).
2. **Draft detail editor (`/stories/[id]`)** — two-pane (story list left, edit form right). Image preview (read-only), title + summary fields, **body field with Edit / Preview tabs** (Preview renders through `markdown-sanitize` — same contract as the public page), source link, categories multi-select grid, tags chips with Add tag, external ID display-only, action bar (Publish + Reject + Save). Save indicator: "Saved 12s ago" tied to manual Save (per ADR 0004 § G — last-saved-at, not autosave).
3. **Published list (`/published`)** — same table layout, Edit + Un-publish row actions, publish-date column. Un-publish surfaces a confirm dialog: *"This will hide the story from /story/[slug] and the public feed. Anyone who already shared the URL will hit a 404."*
4. **Rejected list (`/rejected`)** — same table layout, Restore + Delete row actions, Reason column (from `reject_reason`).
5. **Settings (`/settings`)** — three grouped panels:
   - **Ingestion** — UI stub. Form fields (poll interval, RSS source URLs list with add/remove, auto-draft threshold) save to `admin_settings`. **No code reads from these settings yet** — that wires up in slice 0011 (OpenClaw remote-control). Add a banner: *"Active when slice 0011 ships the OpenClaw config sync."*
   - **Categories** — runtime-mutable name + sort_order. Drag-handle reordering, name input per row, slug shown read-only in mono. Save button per panel. Updates persist via the new `PATCH /api/admin/categories/[id]` and reflect on the public reader (the slice-0004 seed has been changed to not clobber name overrides).
   - **Auth** — UI stub per ADR 0004 § P. Email + session timeout fields. Banner: *"Active when admin moves off Tailscale (ADR-0003 migration trigger)."* Inputs save to `admin_settings`; nothing reads from them.
6. **Extra states** — empty queue, reject confirmation dialog (with optional reason input), success + error toasts, form validation errors.

### Admin search

Add `?q=` to `listPublishedStories` (already wired) and to the new `listDraftStories` and `listRejectedStories` helpers. Plain `ILIKE` on `title` + `short_summary`. Wire the search input on each list page.

### Reader-facing regression tests

Add to `packages/shared/src/db/queries.test.ts`:

- `listPublishedStories` excludes `rejected` AND newly-`draft` (un-published) rows.
- `getPublishedStoryBySlug` returns null for `rejected` and `draft` rows.

These confirm un-publish and reject both immediately remove a Story from public surfaces.

## Acceptance criteria

- [ ] `StatusTransition` matrix matches the table above; Vitest covers every cell. Illegal transitions return a useful error message.
- [ ] Schema migration adds `reject_reason` and `admin_settings`; `categories` seed migration updated to `ON CONFLICT DO NOTHING`.
- [ ] Reject endpoint: flips draft to `rejected`, persists optional `reason`. Drafts queue no longer shows it.
- [ ] Un-publish endpoint: flips published to `draft`, clears `published_at`. Public reader surfaces immediately stop returning it. Confirm dialog appears before action.
- [ ] Restore endpoint: flips rejected to `draft`, clears `reject_reason`.
- [ ] Delete endpoint: hard-deletes from Rejected list, including the Storage object.
- [ ] PATCH endpoint: edits work on both `draft` and `published`. `slug` / `published_at` / `external_id` / `status` ignored on the body.
- [ ] Categories PATCH: `name` + `sort_order` editable; `slug` rejected with 400.
- [ ] Admin Drafts queue (`/`) renders per design: sidebar counts live, status tabs work as filters, table rows match design row spec.
- [ ] Draft detail editor renders per design: two-pane, image read-only, Body Edit/Preview tabs (Preview uses `markdown-sanitize`), category multi-select, tag chips with add/remove, external ID display, action bar with Publish/Reject/Save + "Saved Xs ago" indicator tied to manual save.
- [ ] Published list (`/published`) renders with Edit + Un-publish row actions and publish-date column. Un-publish click → confirm dialog → action.
- [ ] Rejected list (`/rejected`) renders with Restore + Delete row actions and Reason column populated from `reject_reason`.
- [ ] Settings page (`/settings`) renders all three panels. Categories panel actually edits names + sort_order; saves reflect on the public feed. Ingestion + Auth panels save to `admin_settings` but show their respective "Active when…" banners.
- [ ] Admin search works on each list (drafts, published, rejected) via `?q=`; plain ILIKE.
- [ ] Reader-facing regressions: `rejected` and un-published-`draft` rows never leak to `/api/feed`, `/api/story/[slug]`, web `/`, or the OG card route.
- [ ] Empty-queue, reject-confirm, toast, and form-validation states match the design.
- [ ] Existing slice 0001/0002 admin queue at `/` is replaced by the new sidebar+table layout — no two parallel admins.

## Blocked by

- Issue 0004
- Issue 0005 (Markdown Preview tab needs `markdown-sanitize` from 0005)

---

**Status:** Shipped via Sandcastle on 2026-05-23. Merge commit: 356b539.

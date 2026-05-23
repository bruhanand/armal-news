# Issue 0011 — OpenClaw remote-control protocol (admin ↔ OpenClaw config sync)

**Labels:** ready-for-agent, AFK

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## Design source

Locked by [ADR 0004 — design pack v1 is visual source of truth](../adr/0004-design-pack-v1-is-visual-source-of-truth.md) §O — *"Settings → Ingestion is a remote-control plane, not an in-process poller."*

Slice 0008 ships the Settings → Ingestion UI as a stub that writes to `admin_settings`. This slice activates that stub by giving OpenClaw a way to read it and apply the config to its actual ingest behavior.

## What to build

A config-sync protocol over Tailscale between the Admin Dashboard (Next.js, on the admin's MacBook) and OpenClaw (on the admin's Linux laptop). The Admin remains the control surface; OpenClaw remains the runtime. No serverless RSS-polling worker inside the Next.js admin (per ADR-0003).

### Config schema

The fields the admin Settings page already saves to `admin_settings` (slice 0008):

- `ingestion.poll_interval_minutes: number` (e.g. 15)
- `ingestion.rss_sources: string[]` (RSS / Atom feed URLs)
- `ingestion.auto_draft_threshold: number` (0..1; below → discard, ≥ → ingest as draft)

Stored as a JSON blob under the `admin_settings.ingestion` key. Schema validated by a shared zod schema in `packages/shared/src/validation/admin-settings.ts`.

### Sync protocol

Two options — pick one and document the choice with a one-line ADR amendment:

- **Option A (pull from OpenClaw):** OpenClaw polls the Admin Dashboard's new `GET /api/admin/openclaw/config` endpoint over Tailscale every N seconds (N small, default 30). Endpoint returns the current `admin_settings.ingestion` value. OpenClaw caches in memory; applies on the next ingest cycle.
- **Option B (push from Admin):** When the admin saves the Settings → Ingestion panel, the Admin Dashboard POSTs the new config to OpenClaw's `POST /openclaw/config` endpoint (Tailscale hostname configured via env). OpenClaw applies immediately.

**Recommend A** — pull-based is simpler, no Admin → OpenClaw env wiring, no retry logic on push. OpenClaw is the only consumer; if it's down, no propagation problem to solve. Trade-off: up to N seconds of staleness between save and apply, which is fine at the cadence the admin operates.

### Endpoints (Option A)

- `apps/admin` `GET /api/admin/openclaw/config` — returns the current `admin_settings.ingestion` JSON. Tailscale-only (per ADR-0003 — no auth check, Tailscale is the boundary). Includes a `version` field (the `admin_settings.updated_at` of the row) so OpenClaw can detect changes without re-applying on every poll.
- Optional: `GET /api/admin/openclaw/health` — OpenClaw can periodically write a heartbeat (last-seen timestamp + last-ingest-cycle status) to `admin_settings.openclaw_health` via a dedicated `POST /api/admin/openclaw/heartbeat` endpoint. The Settings page reads this to render an OpenClaw-status badge ("Connected · last ingest 4 min ago") so the admin knows the loop is closed.

### OpenClaw side (out of this codebase, but documented)

OpenClaw is on the admin's Linux laptop and lives in a separate repo. This slice's job for OpenClaw is to:

- Add a config-poller (every 30s, hits `https://<admin-tailscale-host>/api/admin/openclaw/config`).
- Parse with the same shared zod schema (vendor or copy `IngestionConfig` so both sides validate identically — recommend vendoring rather than depending on the Next.js workspace).
- Apply changes: reload the RSS source list, change the next-poll-due timer, update the auto-draft threshold used by the existing classifier.
- Optional: POST heartbeat after each ingest cycle.

The OpenClaw changes ship in OpenClaw's own repo; track them in a follow-up ticket there. This Armal-side issue covers everything inside `apps/admin` + `packages/shared`.

### Settings page activation

Slice 0008 shipped the Settings → Ingestion panel with a banner: *"Active when slice 0011 ships the OpenClaw config sync."* This slice removes that banner. Replace it with the OpenClaw health badge (if implemented) or a simpler "Last applied: Xs ago" line driven by the optional heartbeat.

## Acceptance criteria

- [ ] `packages/shared/src/validation/admin-settings.ts` exports `IngestionConfig` zod schema; both Admin and (eventually) OpenClaw validate against it.
- [ ] `apps/admin` `GET /api/admin/openclaw/config` returns the current `admin_settings.ingestion` JSON + a `version` field (updated_at). Tailscale-only, no auth.
- [ ] Saving the Settings → Ingestion panel updates `admin_settings.ingestion` and bumps `updated_at`. The next poll from OpenClaw sees the new version.
- [ ] (If implementing heartbeat) `POST /api/admin/openclaw/heartbeat` upserts `admin_settings.openclaw_health` with `{ last_seen, last_ingest_status }`. The Settings page renders a status badge from it.
- [ ] The "Active when slice 0011 ships…" banner from slice 0008 is removed.
- [ ] Repository test: posting config A then config B causes `GET /api/admin/openclaw/config` to return B with a new version. Versions are monotonic.
- [ ] Documentation: a top-level note in the OpenClaw repo's README pointing at the contract here. (Or, if OpenClaw repo isn't accessible from this codebase, a `docs/openclaw-contract.md` in this repo describing what OpenClaw must implement, so the OpenClaw maintainer has a single place to read.)

## Out of scope

- Authentication on the config endpoints — Tailscale is the boundary (ADR-0003). Migration trigger is when the admin moves off Tailscale; at that point this slice's endpoints get the same auth shim as everything else.
- Push-based sync (Option B above) unless the user explicitly picks it.
- Implementing the OpenClaw side of the protocol — that's a follow-up in the OpenClaw repo.

## Blocked by

- Issue 0008 (the Settings → Ingestion UI + `admin_settings` table must exist for this slice to activate them)

---

**Status:** Shipped via Sandcastle on 2026-05-23. Merge commit: b374e7c.

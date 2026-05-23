# OpenClaw ↔ Admin Dashboard contract

This file is the single source of truth for the protocol OpenClaw must
implement to integrate with the Admin Dashboard. OpenClaw lives in a separate
repo on the admin's Linux laptop; this codebase (the Admin Dashboard +
shared package) owns the schemas and the endpoints. Keep this doc in sync
with `packages/shared/src/validation/admin-settings.ts` and the routes
under `apps/admin/src/app/api/admin/openclaw/`.

## Transport

- Tailscale private mesh between the admin's MacBook (Admin Dashboard,
  Next.js, port 3001) and the admin's Linux laptop (OpenClaw). No public
  internet exposure. **No app-level auth on the endpoints** — Tailscale's
  peer auth is the boundary (ADR-0003).
- Base URL: `https://<admin-tailscale-hostname>:3001`. Configurable in
  OpenClaw via env var (e.g. `ADMIN_BASE_URL`).
- All payloads JSON; `Content-Type: application/json`.

## 1. Config pull — `GET /api/admin/openclaw/config`

OpenClaw polls this endpoint every ~30 seconds. Returns the current
ingestion config plus a version stamp.

**Response shape (200):**

```json
{
  "version": "2026-05-23T12:00:00.000Z",
  "config": {
    "pollIntervalMinutes": 15,
    "rssSourceUrls": ["https://feeds.example/a", "https://feeds.example/b"],
    "autoDraftThreshold": 0.72
  }
}
```

When no ingestion settings have been saved yet, both fields are `null`:

```json
{ "version": null, "config": null }
```

- `version` is the `updated_at` timestamp of the underlying
  `admin_settings.ingestion` row. **Monotonic**: every save bumps it
  strictly forward. OpenClaw should compare the new `version` against the
  one it last applied and skip re-applying if equal — re-applying is a
  no-op but pointless work, and `version === lastApplied.version`
  guarantees nothing changed.
- `config` validates against the `IngestionConfig` zod schema in
  `packages/shared/src/validation/admin-settings.ts`. **Vendor or copy
  that file** into OpenClaw rather than depending on the Next.js
  workspace — single contract, two validators.

### Applying changes (OpenClaw side)

- `pollIntervalMinutes` — change the next-poll-due timer.
- `rssSourceUrls` — replace the feed list. Removing a URL stops fetching
  from it on the next cycle.
- `autoDraftThreshold` — feed into the existing classifier: stories
  scoring ≥ threshold become drafts; below → discarded.

## 2. Heartbeat — `POST /api/admin/openclaw/heartbeat`

OpenClaw posts here after each ingest cycle so the Admin Dashboard's
Settings page can render an "OpenClaw connected" status badge.

**Request body:**

```json
{
  "status": "ok",
  "message": "ingested 4 stories from 6 feeds"
}
```

- `status: "ok" | "error"` — required. Mirrors the cycle outcome.
- `message: string?` — optional, ≤ 500 chars. Free-form, surfaced in the
  badge tooltip-style row.

**Response (200):**

```json
{
  "ok": true,
  "health": {
    "lastSeen": "2026-05-23T12:34:56.000Z",
    "lastIngestStatus": "ok",
    "lastIngestMessage": "ingested 4 stories from 6 feeds"
  }
}
```

`lastSeen` is server-stamped — the Admin Dashboard does not trust
OpenClaw's clock. OpenClaw can ignore the response body; the heartbeat is
fire-and-forget.

The persisted shape is `OpenClawHealth` in the shared validation module.

## What is NOT in the protocol

- **Authentication / shared secrets.** Tailscale is the boundary; adding
  a token here would be defense-in-depth, but it's deferred until the
  ADR-0003 migration trigger fires.
- **Push from Admin to OpenClaw.** The Admin Dashboard never calls
  OpenClaw; the loop is always OpenClaw → Admin. Up to ~30s of staleness
  between saving Settings → Ingestion and OpenClaw applying it is the
  knowingly accepted trade-off (ADR 0004 § O · pull-based amendment).
- **Story ingest delivery.** Already covered by the existing
  `POST /api/ingest/stories` endpoint and the `IngestBatch` schema in
  `packages/shared/src/validation/story.ts`. Unchanged by this slice.

## Reference files in this repo

- Endpoints: `apps/admin/src/app/api/admin/openclaw/{config,heartbeat}/route.ts`
- Schemas: `packages/shared/src/validation/admin-settings.ts`
- Settings UI consumer: `apps/admin/src/app/settings/SettingsPanels.tsx`
  (the `HealthBadge` component reads `admin_settings.openclaw_health`)

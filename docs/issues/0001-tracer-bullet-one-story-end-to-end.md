# Issue 0001 — Tracer bullet: one story end-to-end

**Labels:** needs-triage, HITL
**Type:** HITL (foundational decisions baked in: monorepo tooling, package manager, Drizzle config, `DATABASE_URL` wiring)

## Parent

[PRD 0001 — Armal News MVP](../prd/0001-mvp.md)

## What to build

Stand up the spine: a single hardcoded Story flows DB → admin Publish click → public web feed. Minimum viable everything; chrome, validation, images, slugs, and categories arrive in later slices.

- pnpm workspace (root `package.json` + `pnpm-workspace.yaml`).
- `packages/shared` with a minimal Drizzle schema for `stories` only: `id`, `title`, `short_summary`, `body_markdown`, `image_url` (nullable for now), `source_link`, `status` enum (`draft` | `published` | `rejected`), `created_at`, `updated_at`, `published_at` nullable. Drizzle config + first migration.
- `apps/admin` (Next.js, runs on `0.0.0.0:3001`, no app-level auth per ADR-0003): a `POST /api/dev/seed-one` route that inserts a hardcoded draft Story; a `/` page that lists drafts in a table; a Publish server action that flips `status` to `published` and stamps `published_at`.
- `apps/web` (Next.js App Router, deployable to Vercel): `GET /api/feed` returning the most recent `status='published'` rows as JSON; `/` RSC page that renders the latest published Story as a single card (image stub, title, short summary, body — no styling beyond defaults).
- Local Postgres via `supabase start` (or compose), `DATABASE_URL` documented in a root `.env.example`. Migration applied via `drizzle-kit` SQL files run with `psql` / `supabase db push` (do NOT use the Supabase MCP — see CLAUDE.md).

## Acceptance criteria

- [ ] `pnpm install` at the repo root resolves all three workspaces (`apps/admin`, `apps/web`, `packages/shared`).
- [ ] `pnpm --filter shared db:migrate` (or equivalent) creates the `stories` table and the `status` enum on a local Postgres.
- [ ] `pnpm --filter admin dev` serves on `0.0.0.0:3001`; `pnpm --filter web dev` serves on `localhost:3000`.
- [ ] Hitting `POST localhost:3001/api/dev/seed-one` creates one `draft` row.
- [ ] The admin `/` page lists the draft; clicking Publish flips its status and stamps `published_at`.
- [ ] `GET localhost:3000/api/feed` returns the published Story.
- [ ] Reloading `localhost:3000/` renders the published Story as a basic card.
- [ ] Both apps import the Drizzle schema from `packages/shared` (no duplicated table definitions).
- [ ] `apps/admin` is NOT configured for any production deployment target.

## Blocked by

None — can start immediately.

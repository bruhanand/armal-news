# Shared Postgres between Admin Dashboard and News App

The blueprint described "two distinct apps for security" with the implication of separate data stores or an HTTP boundary between them. We chose instead to give the **Admin Dashboard** and the **News App** a single shared Postgres database. Publication is a state flip (`status` column on the **Story** table), not a network call or file copy.

## Why

For a single-admin MVP, the security argument for isolating the databases is theoretical: there's one human writing and millions of anonymous readers. The boundary that matters is *the API surface exposed to the internet*, which is still split — Admin Dashboard endpoints are auth-gated and not exposed publicly; News App endpoints serve only `status = 'published'` rows. A shared DB removes an entire class of failure (publish-via-HTTP partial failures, JSON-shape drift between apps, file-shuffling glue) and lets us iterate on the schema in one place.

## Considered alternatives

- **HTTP publish endpoint** — Admin POSTs to `News App /api/publish`. Cleaner boundary, but adds a stateful failure mode (request times out mid-publish; image upload partial) and forces dual-write logic. Reconsider if/when there are multiple admins or compliance constraints.
- **Object storage drop** — Admin writes JSON+image to S3, News App reads. Decouples deployments but introduces eventual consistency and a third moving part for a non-existent scale problem.

## Consequences

- The mobile News App cannot read directly from Postgres; it goes through the News App's own HTTP API (Next.js API routes), which reads the same DB.
- Schema migrations apply to both apps simultaneously; we never have version skew. Trade-off: a breaking schema change requires deploying both apps together.
- If we ever need to physically isolate the admin tier (e.g., move it to a private network), this decision is hard to reverse and we'd revisit.

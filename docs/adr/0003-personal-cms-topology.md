# Personal-CMS topology: Admin Dashboard runs on the admin's laptop, not on a server

The **Admin Dashboard** is the only authoring surface, with exactly one human user (the admin). Rather than deploying it to the same hosting tier as the public **News App**, it runs as a Next.js app at `localhost:3001` on the admin's MacBook. **OpenClaw** (running on the admin's Linux laptop) reaches it over a **Tailscale** private mesh and POSTs new draft Stories. **Postgres** is cloud-hosted (Supabase) so the public News App can read it 24/7 even when the MacBook is asleep.

## Why

The Admin Dashboard has one user and zero public consumers. Deploying it to a public host would add ops surface (HTTPS termination, an internet-exposed admin login, secret rotation, monitoring) for no functional gain. Running it on the laptop:

- Removes the need for an admin auth provider, an admin-app deploy pipeline, and an internet-public admin URL.
- Keeps OpenClaw's outbound traffic inside Tailscale's mesh — no public webhook to harden against drive-by traffic.
- Lets schema iteration happen on the laptop with `supabase db push` / migration files, against the same cloud DB the News App reads from.

The only thing that *must* be cloud-hosted is **Postgres** (and **Supabase Storage** for images), because the public News App must serve readers regardless of whether the MacBook is online.

## Considered alternatives

- **Deploy the Admin Dashboard to the same host as the News App.** Conventional. Adds an internet-public admin URL that needs auth, rate-limiting, and intrusion monitoring. Discarded as unnecessary surface for a single-admin MVP.
- **Run Postgres on the MacBook too.** Tempting because everything would be local. Rejected: the public News App can't depend on the MacBook being awake; readers would see outages whenever the laptop sleeps.
- **Run the Admin Dashboard inside OpenClaw on the Linux laptop.** Conflates two concerns (research agent vs. review UI) and fights OpenClaw's purpose.

## Consequences

- **OpenClaw delivery requires Tailscale up on both laptops.** If the Linux laptop loses Tailscale, OpenClaw retries on its next batch — acceptable for a 4×/day cadence.
- **No internet-public admin endpoint exists.** Recovering admin access from a different machine means installing Tailscale + cloning the dashboard repo on that machine. Acceptable for solo operation.
- **The admin login is optional.** Since the dashboard isn't reachable from the internet, password auth on the Admin Dashboard becomes a defense-in-depth choice, not a primary security control. Decision deferred.
- **Reversal cost is low.** Promoting the Admin Dashboard to a deployed service later is a one-day change: add a host, add an auth provider, point Tailscale's webhook target at the host's hostname.

## Migration trigger

The admin has explicitly chosen to defer cloud-hosting OpenClaw + the Admin Dashboard until **revenue justifies the ops cost**. At that point: (1) deploy the Admin Dashboard to a host (Railway/Fly/Vercel), (2) add app-level auth (env-var password or OAuth), (3) deploy OpenClaw to the same provider or a separate worker host, (4) repoint OpenClaw's webhook target from the Tailscale hostname to the Admin Dashboard's public URL. None of the application code, schema, or API contracts change.

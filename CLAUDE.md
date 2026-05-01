# AI News Platform — Project Memory

## Constraints

### Do NOT use the Supabase MCP for this project (yet)

The Supabase MCP server (`mcp__claude_ai_Supabase__*`) appears in the deferred-tools list, but it is currently connected to a **different** Supabase project. Calling any of those tools from this project would target the wrong database.

Until the user explicitly says "the Supabase MCP is now connected to this project, you can use it," do **not** call:

- `mcp__claude_ai_Supabase__apply_migration`
- `mcp__claude_ai_Supabase__execute_sql`
- `mcp__claude_ai_Supabase__deploy_edge_function`
- `mcp__claude_ai_Supabase__create_project`
- `mcp__claude_ai_Supabase__get_logs`
- any other `mcp__claude_ai_Supabase__*` tool

For database work in this project, treat Supabase as a vanilla Postgres provider: write SQL migration files by hand, manage them with a local migration tool (e.g., `supabase` CLI, `node-pg-migrate`, or a Prisma/Drizzle migration command), and connect via `DATABASE_URL`. The user will run these themselves.

## Quick references

- **CONTEXT.md** — the project's domain language and topology.
- **docs/adr/** — architectural decisions (start with `0001` and read forward).
- **PRODUCT_BLUEPRINT.md / PARTNER_PITCH.md / IMPLEMENTATION_GUIDE.md / IMPLEMENTATION_PLAN.md** — original planning docs. Anywhere these conflict with `CONTEXT.md` or the ADRs, the latter win.

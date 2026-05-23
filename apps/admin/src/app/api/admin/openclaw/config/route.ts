import { NextResponse } from "next/server";
import { getAdminSetting } from "@armal/shared/db/queries";

export const dynamic = "force-dynamic";

// OpenClaw polls this every ~30s over Tailscale. No auth — Tailscale is the
// boundary (ADR-0003). The `version` field is the row's updated_at; OpenClaw
// uses it to skip re-applying when the config hasn't changed since the last
// poll. Returns `{ version: null, config: null }` if no ingestion settings
// have been saved yet.
export async function GET() {
  const row = await getAdminSetting("ingestion");
  if (!row) {
    return NextResponse.json({ version: null, config: null });
  }
  return NextResponse.json({
    version: row.updatedAt.toISOString(),
    config: row.value,
  });
}

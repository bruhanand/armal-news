import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertAdminSetting } from "@armal/shared/db/queries";
import { OPENCLAW_INGEST_STATUSES } from "@armal/shared/validation/admin-settings";

export const dynamic = "force-dynamic";

// OpenClaw posts here after each ingest cycle so the Settings page can render
// an "OpenClaw connected · last ingest 4m ago" badge. `lastSeen` is server-
// stamped (we don't trust OpenClaw's clock); the body carries only the
// ingest-cycle outcome.
const Body = z
  .object({
    status: z.enum(OPENCLAW_INGEST_STATUSES),
    message: z.string().max(500).optional(),
  })
  .strict();

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body" },
      { status: 400 },
    );
  }
  const value = {
    lastSeen: new Date().toISOString(),
    lastIngestStatus: parsed.data.status,
    ...(parsed.data.message ? { lastIngestMessage: parsed.data.message } : {}),
  };
  const row = await upsertAdminSetting("openclaw_health", value);
  return NextResponse.json({ ok: true, health: row.value });
}

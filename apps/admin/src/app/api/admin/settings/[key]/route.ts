import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertAdminSetting } from "@armal/shared/db/queries";

export const dynamic = "force-dynamic";

// admin_settings.value is jsonb; each key owns its own shape, validated by
// the consumer when it reads. We only enforce that the body carries a `value`
// key here — its inner shape is whatever the caller's settings panel writes.
const PatchBody = z
  .object({
    value: z
      .unknown()
      .refine((v) => v !== undefined, { message: "value is required" }),
  })
  .strict();

const KEY_RE = /^[a-z][a-z0-9_-]{0,63}$/;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: "invalid settings key" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body" },
      { status: 400 },
    );
  }
  const row = await upsertAdminSetting(key, parsed.data.value);
  return NextResponse.json({ ok: true, setting: row });
}

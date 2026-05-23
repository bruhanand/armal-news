import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, stories } from "@armal/shared/db";
import { statusTransition } from "@armal/shared/validation/story";

export const dynamic = "force-dynamic";

const Body = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .strict()
  .optional();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let parsed: { reason?: string } | undefined;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
    }
    const r = Body.safeParse(body);
    if (!r.success) {
      return NextResponse.json(
        { error: r.error.issues[0]?.message ?? "invalid body" },
        { status: 400 },
      );
    }
    parsed = r.data;
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "story not found" }, { status: 404 });
  }

  const result = statusTransition({
    from: existing.status,
    to: "rejected",
    reason: parsed?.reason,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const [row] = await db
    .update(stories)
    .set(result.patch)
    .where(eq(stories.id, id))
    .returning();
  return NextResponse.json({ ok: true, story: row });
}

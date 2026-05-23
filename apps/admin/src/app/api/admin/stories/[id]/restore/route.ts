import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, stories } from "@armal/shared/db";
import { statusTransition } from "@armal/shared/validation/story";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  const [existing] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "story not found" }, { status: 404 });
  }
  const result = statusTransition({ from: existing.status, to: "draft" });
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

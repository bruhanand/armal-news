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

  // Re-publish is a no-op (per the issue spec): the transition guard returns
  // a published→published patch with no side-effect, so the row is left
  // exactly as-is.
  if (existing.status === "published") {
    return NextResponse.json({ ok: true, story: existing });
  }

  const result = statusTransition({ from: existing.status, to: "published" });
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

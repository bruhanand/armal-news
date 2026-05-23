import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, stories } from "@armal/shared/db";
import { deleteStoryImageByUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Hard delete from the Rejected list. The design pack's "Delete" action is
// only surfaced on the Rejected screen — we enforce that here so a misfire
// from another tab can't wipe a draft or live story. Storage object goes
// best-effort: the Postgres row delete is the source of truth, so a Storage
// 404 (already gone) or transient failure must not roll back the row delete.
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
  if (existing.status !== "rejected") {
    return NextResponse.json(
      { error: "only rejected stories can be deleted" },
      { status: 400 },
    );
  }

  // story_categories cascades on delete (see schema). The image goes through
  // a separate Storage call below.
  await db.delete(stories).where(eq(stories.id, id));

  try {
    await deleteStoryImageByUrl(existing.imageUrl);
  } catch {
    // Swallow: the row is already gone, and the bucket-level cleanup is a
    // courtesy. A surfaced error here would lie about the row state.
  }

  return NextResponse.json({ ok: true });
}

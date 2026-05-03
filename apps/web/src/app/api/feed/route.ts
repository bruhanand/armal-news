// Response envelope for read endpoints:
//   2xx → the resource (e.g. { stories } / { categories } / { story })
//   4xx → { error: string } with the matching HTTP status
// Single-resource GETs can collapse failure into the HTTP status, so the body
// stays thin. Batch-write endpoints use a richer per-item shape — see
// apps/admin/src/app/api/ingest/stories/route.ts.
import { NextResponse } from "next/server";
import { listPublishedStories } from "@armal/shared/db/queries";
import { isCategorySlug } from "@armal/shared/constants/categories";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;

  if (category !== undefined && !isCategorySlug(category)) {
    return NextResponse.json(
      { error: `unknown category slug: ${category}` },
      { status: 400 },
    );
  }

  const rows = await listPublishedStories({ category });
  return NextResponse.json({ stories: rows });
}

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

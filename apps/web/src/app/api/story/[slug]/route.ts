import { NextResponse } from "next/server";
import { getPublishedStoryBySlug } from "@armal/shared/db/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ story });
}

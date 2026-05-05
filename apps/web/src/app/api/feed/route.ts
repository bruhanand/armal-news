// Response envelope for the read endpoint:
//   2xx → { items: FeedItem[], nextCursor: string | null }
//   4xx → { error: string }
// Cursor format is `<publishedAt-iso>__<storyId-uuid>` — see parseCursor in
// @armal/shared/db/queries. Malformed cursors return 400 here.
import { NextResponse } from "next/server";
import { parseCursor } from "@armal/shared/db/queries";
import { isCategorySlug } from "@armal/shared/constants/categories";
import {
  FEED_PAGE_LIMIT,
  FEED_PAGE_LIMIT_MAX,
} from "@/app/feed/feedItem";
import { fetchFeedPage } from "@/app/feed/fetchFeedPage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limitRaw = searchParams.get("limit");

  if (category !== undefined && !isCategorySlug(category)) {
    return NextResponse.json(
      { error: `unknown category slug: ${category}` },
      { status: 400 },
    );
  }

  if (cursor !== undefined && parseCursor(cursor) === null) {
    return NextResponse.json(
      { error: `malformed cursor: ${cursor}` },
      { status: 400 },
    );
  }

  let limit = FEED_PAGE_LIMIT;
  if (limitRaw !== null) {
    const parsed = Number.parseInt(limitRaw, 10);
    if (
      !Number.isFinite(parsed) ||
      parsed < 1 ||
      parsed > FEED_PAGE_LIMIT_MAX
    ) {
      return NextResponse.json(
        { error: `limit must be an integer in [1, ${FEED_PAGE_LIMIT_MAX}]` },
        { status: 400 },
      );
    }
    limit = parsed;
  }

  const page = await fetchFeedPage({ category, cursor, limit });
  return NextResponse.json(page);
}

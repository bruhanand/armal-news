import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, stories } from "@armal/shared/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = await db
    .select()
    .from(stories)
    .where(eq(stories.status, "published"))
    .orderBy(desc(stories.publishedAt))
    .limit(50);
  return NextResponse.json({ stories: rows });
}

import { NextResponse } from "next/server";
import { listCategories } from "@armal/shared/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listCategories();
  return NextResponse.json({ categories: rows });
}

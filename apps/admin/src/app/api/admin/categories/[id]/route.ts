import { NextResponse } from "next/server";
import { z } from "zod";
import { updateCategory } from "@armal/shared/db/queries";

export const dynamic = "force-dynamic";

// `slug` is immutable (ADR 0004 § F) — if the client sends it we 400 rather
// than silently ignoring, so a future caller can't accidentally rely on
// slug-rename-by-PATCH. .strict() rejects the key shape; the manual check
// below substitutes a clearer error message.
const PatchBody = z
  .object({
    name: z.string().min(1).max(100).optional(),
    sort_order: z.number().int().optional(),
  })
  .strict();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (body !== null && typeof body === "object" && "slug" in body) {
    return NextResponse.json(
      { error: "slug is immutable; edit it in constants/categories.ts" },
      { status: 400 },
    );
  }
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body" },
      { status: 400 },
    );
  }

  const row = await updateCategory(id, {
    name: parsed.data.name,
    sortOrder: parsed.data.sort_order,
  });
  if (!row) {
    return NextResponse.json({ error: "category not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, category: row });
}

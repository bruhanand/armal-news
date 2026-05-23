import { NextResponse } from "next/server";
import { sanitizeMarkdown } from "@armal/shared/lib/markdown-sanitize";

// Server-side preview for the admin editor's Preview tab. The shared
// sanitizer is server-only (remark/rehype pull in node-only deps), so
// the editor posts the markdown here and renders the returned HTML.
// Admin preview ≡ public render byte-for-byte (ADR 0004 § E) because
// both surfaces go through `sanitizeMarkdown`.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { body_markdown?: unknown };
  try {
    body = (await req.json()) as { body_markdown?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (typeof body.body_markdown !== "string") {
    return NextResponse.json(
      { error: "body_markdown is required" },
      { status: 400 },
    );
  }
  const html = sanitizeMarkdown(body.body_markdown);
  return NextResponse.json({ html });
}

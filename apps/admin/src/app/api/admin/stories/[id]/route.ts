import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, stories } from "@armal/shared/db";
import {
  getCategoryIdsBySlug,
  setStoryCategories,
} from "@armal/shared/db/queries";
import { sanitizeMarkdown } from "@armal/shared/lib/markdown-sanitize";
import { CATEGORY_SLUGS } from "@armal/shared/constants/categories";
import { isHttpUrl } from "@armal/shared/lib/url";

export const dynamic = "force-dynamic";

// Slug, external_id, published_at, status are *intentionally* ignored on the
// patch body (per the issue spec): slug + external_id are immutable join
// keys; status changes go through the dedicated transition endpoints;
// published_at is stamped by the publish endpoint.
const PatchBody = z
  .object({
    title: z.string().min(1).max(300).optional(),
    short_summary: z.string().min(1).optional(),
    body_markdown: z.string().min(1).optional(),
    source_link: z
      .string()
      .url()
      .refine(isHttpUrl, "must be an http(s) URL")
      .optional(),
    tags: z.array(z.string()).optional(),
    category_slugs: z
      .array(z.enum(CATEGORY_SLUGS))
      .min(1)
      .refine((arr) => new Set(arr).size === arr.length, {
        message: "category_slugs must be unique",
      })
      .optional(),
  })
  // Loose, not strict: ignore unknown keys (slug, external_id, status,
  // published_at, image_url) instead of 400-ing the whole patch.
  .passthrough();

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
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body" },
      { status: 400 },
    );
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "story not found" }, { status: 404 });
  }
  if (existing.status !== "draft" && existing.status !== "published") {
    return NextResponse.json(
      { error: "only draft or published stories can be edited" },
      { status: 400 },
    );
  }

  const set: {
    title?: string;
    shortSummary?: string;
    bodyMarkdown?: string;
    sourceLink?: string;
    tags?: string[];
  } = {};
  if (parsed.data.title !== undefined) set.title = parsed.data.title;
  if (parsed.data.short_summary !== undefined)
    set.shortSummary = parsed.data.short_summary;
  if (parsed.data.body_markdown !== undefined)
    set.bodyMarkdown = sanitizeMarkdown(parsed.data.body_markdown);
  if (parsed.data.source_link !== undefined)
    set.sourceLink = parsed.data.source_link;
  if (parsed.data.tags !== undefined) set.tags = parsed.data.tags;

  const slugs = parsed.data.category_slugs;

  // One transaction wraps the row update + the join reconciliation so a
  // failed category swap rolls back the title/body changes too.
  const row = await db.transaction(async (tx) => {
    let updated = existing;
    if (Object.keys(set).length > 0) {
      const [u] = await tx
        .update(stories)
        .set(set)
        .where(eq(stories.id, id))
        .returning();
      if (u) updated = u;
    }
    if (slugs) {
      const ids = await getCategoryIdsBySlug(tx, slugs);
      await setStoryCategories(tx, id, ids);
    }
    return updated;
  });

  return NextResponse.json({ ok: true, story: row });
}

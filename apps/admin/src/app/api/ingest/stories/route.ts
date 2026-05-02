import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "@armal/shared/db";
import { resolveSlug } from "@armal/shared/lib/slugify";
import {
  IngestBatch,
  type IngestStoryV1,
} from "@armal/shared/validation/story";
import { uploadStoryImage } from "@/lib/storage";

type IngestResult = {
  index: number;
  external_id: string;
  slug: string;
  action: "inserted" | "updated";
};

type IngestError = { index: number; message: string };

async function fetchAndUploadImage(story: IngestStoryV1): Promise<string> {
  const res = await fetch(story.image_url);
  if (!res.ok) {
    throw new Error(
      `image fetch failed (${res.status}) for ${story.image_url}`,
    );
  }
  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const { publicUrl } = await uploadStoryImage({
    externalId: story.external_id,
    contentType,
    body: await res.arrayBuffer(),
  });
  return publicUrl;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: [{ index: -1, message: "invalid JSON" }] },
      { status: 400 },
    );
  }

  const parsed = IngestBatch.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const [, indexRaw] = issue.path;
      const index = typeof indexRaw === "number" ? indexRaw : -1;
      return {
        index,
        message: `${issue.path.join(".")}: ${issue.message}`,
      };
    });
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const db = getDb();
  const results: IngestResult[] = [];
  const errors: IngestError[] = [];

  // Categories are validated against the seeded list at zod, so this lookup
  // is purely id-resolution. Nine rows total — single query, no caching.
  const allSlugs = Array.from(
    new Set(parsed.data.stories.flatMap((s) => s.category_slugs)),
  );
  const categoryRows = allSlugs.length
    ? await db
        .select({ id: categories.id, slug: categories.slug })
        .from(categories)
        .where(inArray(categories.slug, allSlugs))
    : [];
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

  // Sequential: two new Stories with the same title must see each
  // other's chosen slug before the next collision check, otherwise
  // both pick the bare slug and the second insert dupes.
  for (let i = 0; i < parsed.data.stories.length; i++) {
    const story: IngestStoryV1 = parsed.data.stories[i]!;

    let cdnUrl: string;
    try {
      cdnUrl = await fetchAndUploadImage(story);
    } catch (e) {
      errors.push({
        index: i,
        message: `${story.external_id}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      });
      continue;
    }

    const categoryIds = story.category_slugs.map((slug) => {
      const id = categoryIdBySlug.get(slug);
      if (!id) {
        // Defensive: zod already enforces seeded slugs, so this can only
        // happen if the seed migration was rolled back mid-flight.
        throw new Error(`category slug not found: ${slug}`);
      }
      return id;
    });

    try {
      // One transaction per Story: the stories upsert + the join reconciliation
      // commit together, so a join failure rolls back the row write. The image
      // upload to Storage already happened above (Storage is not transactional;
      // re-runs reupload via upsert).
      const txResult = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(stories)
          .where(eq(stories.externalId, story.external_id))
          .limit(1);

        if (existing) {
          await tx
            .update(stories)
            .set({
              title: story.title,
              shortSummary: story.short_summary,
              bodyMarkdown: story.body_markdown,
              imageUrl: cdnUrl,
              sourceLink: story.source_link,
            })
            .where(eq(stories.externalId, story.external_id));

          // Delete-then-insert keeps the writer simple. The join table has no
          // other writers; OpenClaw is single-writer and the ingest loop is
          // sequential, so the brief gap between delete and insert is not a
          // visibility hazard — both run inside this row's transaction.
          await tx
            .delete(storyCategories)
            .where(eq(storyCategories.storyId, existing.id));
          if (categoryIds.length) {
            await tx.insert(storyCategories).values(
              categoryIds.map((cid) => ({
                storyId: existing.id,
                categoryId: cid,
              })),
            );
          }

          return {
            slug: existing.slug,
            action: "updated" as const,
          };
        }

        const slug = await resolveSlug(story.title, async (candidate) => {
          const [hit] = await tx
            .select({ slug: stories.slug })
            .from(stories)
            .where(eq(stories.slug, candidate))
            .limit(1);
          return Boolean(hit);
        });

        const [inserted] = await tx
          .insert(stories)
          .values({
            externalId: story.external_id,
            slug,
            title: story.title,
            shortSummary: story.short_summary,
            bodyMarkdown: story.body_markdown,
            imageUrl: cdnUrl,
            sourceLink: story.source_link,
            status: "draft",
          })
          .returning({ id: stories.id, slug: stories.slug });

        if (categoryIds.length) {
          await tx.insert(storyCategories).values(
            categoryIds.map((cid) => ({
              storyId: inserted!.id,
              categoryId: cid,
            })),
          );
        }

        return {
          slug: inserted!.slug,
          action: "inserted" as const,
        };
      });

      results.push({
        index: i,
        external_id: story.external_id,
        slug: txResult.slug,
        action: txResult.action,
      });
    } catch (e) {
      errors.push({
        index: i,
        message: `${story.external_id}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      });
    }
  }

  return NextResponse.json({ ok: errors.length === 0, results, errors });
}

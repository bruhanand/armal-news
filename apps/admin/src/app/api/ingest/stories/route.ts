import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, stories } from "@armal/shared/db";
import {
  loadCategoryIdMap,
  setStoryCategories,
} from "@armal/shared/db/queries";
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
  // One SELECT for every seeded Category up-front. The set is fixed (9 rows
  // for slice 0004) and the per-batch ingest is the hot path, so resolving
  // slug→id once here is strictly cheaper than re-querying inside each
  // per-Story transaction. zod has already constrained slugs to the seeded
  // enum, so a missing entry means the seed migration was rolled back.
  const categoryIdBySlug = await loadCategoryIdMap(db);

  const results: IngestResult[] = [];
  const errors: IngestError[] = [];

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

    try {
      const categoryIds = story.category_slugs.map((slug) => {
        const id = categoryIdBySlug.get(slug);
        if (!id) throw new Error(`category slug not found: ${slug}`);
        return id;
      });

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

          await setStoryCategories(tx, existing.id, categoryIds);

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

        await setStoryCategories(tx, inserted!.id, categoryIds);

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

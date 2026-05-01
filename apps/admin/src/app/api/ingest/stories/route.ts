import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, stories } from "@armal/shared/db";
import { resolveSlug } from "@armal/shared/lib/slugify";
import {
  IngestBatch,
  type IngestStoryV1,
} from "@armal/shared/validation/story";

type IngestResult = {
  index: number;
  external_id: string;
  slug: string;
  action: "inserted" | "updated";
};

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

  // tags persisted in 0004; category_slugs persisted in 0004.
  for (let i = 0; i < parsed.data.stories.length; i++) {
    const story: IngestStoryV1 = parsed.data.stories[i]!;
    const [existing] = await db
      .select()
      .from(stories)
      .where(eq(stories.externalId, story.external_id))
      .limit(1);

    if (existing) {
      await db
        .update(stories)
        .set({
          title: story.title,
          shortSummary: story.short_summary,
          bodyMarkdown: story.body_markdown,
          imageUrl: story.image_url,
          sourceLink: story.source_link,
        })
        .where(eq(stories.externalId, story.external_id));
      results.push({
        index: i,
        external_id: story.external_id,
        slug: existing.slug,
        action: "updated",
      });
    } else {
      const slug = await resolveSlug(story.title, async (candidate) => {
        const [hit] = await db
          .select({ slug: stories.slug })
          .from(stories)
          .where(eq(stories.slug, candidate))
          .limit(1);
        return Boolean(hit);
      });

      const [inserted] = await db
        .insert(stories)
        .values({
          externalId: story.external_id,
          slug,
          title: story.title,
          shortSummary: story.short_summary,
          bodyMarkdown: story.body_markdown,
          imageUrl: story.image_url,
          sourceLink: story.source_link,
          status: "draft",
        })
        .returning({ slug: stories.slug });

      results.push({
        index: i,
        external_id: story.external_id,
        slug: inserted!.slug,
        action: "inserted",
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}

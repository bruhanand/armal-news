CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "story_categories" (
	"story_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "story_categories_story_id_category_id_pk" PRIMARY KEY("story_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "story_categories" ADD CONSTRAINT "story_categories_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_categories" ADD CONSTRAINT "story_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
-- Seed the nine MVP Categories. Hand-written (drizzle-kit does not generate
-- data-only INSERTs from schema). Keep in sync with
-- packages/shared/src/constants/categories.ts — that file is the source of
-- truth; this block exists so a fresh DB bootstrap leaves exactly nine rows
-- without an out-of-band seed step. ON CONFLICT DO UPDATE makes re-runs
-- (and any future name/sort_order edits) a no-op vs idempotent reset.
INSERT INTO "categories" ("slug", "name", "sort_order") VALUES
  ('ai-in-tech',        'AI in Tech',           10),
  ('ai-in-finance',     'AI in Finance',        20),
  ('ai-in-healthcare',  'AI in Healthcare',     30),
  ('ai-in-robotics',    'AI in Robotics',       40),
  ('ai-in-cooking',     'AI in Cooking',        50),
  ('ai-in-education',   'AI in Education',      60),
  ('ai-research',       'AI Research & Models', 70),
  ('ai-tools',          'AI Tools & Products',  80),
  ('ai-policy-safety',  'AI Policy & Safety',   90)
ON CONFLICT ("slug") DO UPDATE
  SET "name" = excluded."name",
      "sort_order" = excluded."sort_order";
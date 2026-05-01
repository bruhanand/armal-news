ALTER TABLE "stories" ADD COLUMN "external_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_external_id_unique" UNIQUE("external_id");--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_slug_unique" UNIQUE("slug");
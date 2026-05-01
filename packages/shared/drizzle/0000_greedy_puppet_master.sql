CREATE TYPE "public"."story_status" AS ENUM('draft', 'published', 'rejected');--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"short_summary" text NOT NULL,
	"body_markdown" text NOT NULL,
	"image_url" text,
	"source_link" text NOT NULL,
	"status" "story_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);

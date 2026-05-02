import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const storyStatus = pgEnum("story_status", [
  "draft",
  "published",
  "rejected",
]);

export const stories = pgTable("stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: text("external_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  shortSummary: text("short_summary").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  imageUrl: text("image_url").notNull(),
  sourceLink: text("source_link").notNull(),
  status: storyStatus("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;

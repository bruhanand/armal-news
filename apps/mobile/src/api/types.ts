// Shape mirrors apps/web's FeedItem / Story / Category response envelopes
// (see apps/web/src/app/feed/feedItem.ts + the /api routes). Kept in lockstep
// by hand — types aren't shared because @armal/shared/db pulls in postgres
// and drizzle, which we don't want on-device.

export type FeedItem = {
  id: string;
  slug: string;
  title: string;
  shortSummary: string;
  imageUrl: string;
  publishedAt: string | null;
  primaryCategorySlug: string | null;
  primaryCategoryName: string | null;
  readTimeMinutes: number;
};

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

// Matches the Story row returned by `/api/story/[slug]` — fields kept
// in-step with packages/shared/src/db/schema.ts. The column is named
// `body_markdown` for legacy reasons; on the wire it carries
// pre-sanitized HTML (the markdown→HTML conversion happens at admin write
// time). Mobile renders it through react-native-markdown-display — for the
// OpenClaw output shape the prose round-trips cleanly enough; richer HTML
// fall-through is a post-MVP concern.
export type StoryDetail = {
  id: string;
  slug: string;
  title: string;
  shortSummary: string;
  imageUrl: string;
  bodyMarkdown: string;
  sourceLink: string;
  tags: string[];
  publishedAt: string | null;
  status: string;
};

export type Category = {
  slug: string;
  name: string;
  sortOrder: number;
};

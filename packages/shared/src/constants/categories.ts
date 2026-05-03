// Single source of truth for the nine MVP categories.
// The seed migration in packages/shared/drizzle/ MUST be kept in sync with
// this list (see the comment at the bottom of the seed migration file).
// The validator in packages/shared/src/validation/story.ts and the ingest
// pipeline both read from this array — do not hardcode the slug list anywhere
// else.
//
// sortOrder is in increments of 10 so future inserts can land in between
// without a backfill. Note the deliberate name skew: the SQL column is
// `sort_order` (snake_case, Postgres convention) and Drizzle maps it to
// `sortOrder` for TS callers.

export const CATEGORIES = [
  { slug: "ai-in-tech", name: "AI in Tech", iconKey: "tech", sortOrder: 10 },
  {
    slug: "ai-in-finance",
    name: "AI in Finance",
    iconKey: "finance",
    sortOrder: 20,
  },
  {
    slug: "ai-in-healthcare",
    name: "AI in Healthcare",
    iconKey: "healthcare",
    sortOrder: 30,
  },
  {
    slug: "ai-in-robotics",
    name: "AI in Robotics",
    iconKey: "robotics",
    sortOrder: 40,
  },
  {
    slug: "ai-in-cooking",
    name: "AI in Cooking",
    iconKey: "cooking",
    sortOrder: 50,
  },
  {
    slug: "ai-in-education",
    name: "AI in Education",
    iconKey: "education",
    sortOrder: 60,
  },
  {
    slug: "ai-research",
    name: "AI Research & Models",
    iconKey: "research",
    sortOrder: 70,
  },
  {
    slug: "ai-tools",
    name: "AI Tools & Products",
    iconKey: "tools",
    sortOrder: 80,
  },
  {
    slug: "ai-policy-safety",
    name: "AI Policy & Safety",
    iconKey: "policy",
    sortOrder: 90,
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  name: string;
  iconKey: string;
  sortOrder: number;
}>;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = CATEGORIES.map(
  (c) => c.slug,
) as unknown as readonly [CategorySlug, ...CategorySlug[]];

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

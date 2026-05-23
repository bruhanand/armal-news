// Typed client for the public web API. Base URL comes from
// `EXPO_PUBLIC_API_BASE_URL` (Expo injects EXPO_PUBLIC_* into the bundle at
// build time) with a localhost fallback for Expo Go on the laptop. No
// new server-side endpoints are introduced — the mobile app only consumes
// the three public routes already shipped by apps/web (issue 0010 contract).
import type { Category, FeedPage, StoryDetail } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type ApiClient = {
  getFeed: (args?: {
    category?: string;
    cursor?: string;
    limit?: number;
  }) => Promise<FeedPage>;
  getStoryBySlug: (slug: string) => Promise<StoryDetail>;
  getCategories: () => Promise<Category[]>;
};

export function buildFeedUrl(
  baseUrl: string,
  args: { category?: string; cursor?: string; limit?: number } = {},
): string {
  const u = new URL("/api/feed", baseUrl);
  if (args.category) u.searchParams.set("category", args.category);
  if (args.cursor) u.searchParams.set("cursor", args.cursor);
  if (args.limit !== undefined) u.searchParams.set("limit", String(args.limit));
  return u.toString();
}

async function readJson<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body?.error === "string") detail = `: ${body.error}`;
    } catch {
      // body wasn't JSON — fall through with the status alone.
    }
    throw new ApiError(res.status, `${label} ${res.status}${detail}`);
  }
  return (await res.json()) as T;
}

export function createApiClient(
  baseUrl: string,
  fetchImpl: FetchLike = fetch,
): ApiClient {
  return {
    async getFeed(args = {}) {
      const url = buildFeedUrl(baseUrl, args);
      const res = await fetchImpl(url);
      return readJson<FeedPage>(res, "GET /api/feed");
    },
    async getStoryBySlug(slug) {
      const url = new URL(
        `/api/story/${encodeURIComponent(slug)}`,
        baseUrl,
      ).toString();
      const res = await fetchImpl(url);
      const body = await readJson<{ story: StoryDetail }>(
        res,
        `GET /api/story/${slug}`,
      );
      return body.story;
    },
    async getCategories() {
      const url = new URL("/api/categories", baseUrl).toString();
      const res = await fetchImpl(url);
      const body = await readJson<{ categories: Category[] }>(
        res,
        "GET /api/categories",
      );
      return body.categories;
    },
  };
}

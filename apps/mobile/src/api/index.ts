// Single configured ApiClient bound to the env-provided base URL.
// EXPO_PUBLIC_API_BASE_URL is inlined at bundle time by Expo's metro config —
// localhost fallback keeps Expo Go on the laptop pointed at the dev web
// server without a manual env wire.
import { createApiClient } from "./client";

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export const apiClient = createApiClient(API_BASE_URL);

export type { ApiClient } from "./client";
export { ApiError, buildFeedUrl, createApiClient } from "./client";
export type { Category, FeedItem, FeedPage, StoryDetail } from "./types";

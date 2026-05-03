import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/categories", () => {
  it("returns the nine seeded categories ordered by sortOrder ASC", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      categories: Array<{ slug: string; sortOrder: number }>;
    };
    expect(json.categories).toHaveLength(9);
    expect(json.categories.map((c) => c.slug)).toEqual([
      "ai-in-tech",
      "ai-in-finance",
      "ai-in-healthcare",
      "ai-in-robotics",
      "ai-in-cooking",
      "ai-in-education",
      "ai-research",
      "ai-tools",
      "ai-policy-safety",
    ]);
    const orders = json.categories.map((c) => c.sortOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

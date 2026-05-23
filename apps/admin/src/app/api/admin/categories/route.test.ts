import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { categories, getDb } from "@armal/shared/db";
import { CATEGORIES } from "@armal/shared/constants/categories";
import { PATCH } from "./[id]/route";

// Categories survive between tests (only stories is truncated in setup.ts),
// so restore the seeded name + sort_order after each test so a rename does
// not bleed into other suites (the queries.test.ts ordering assertions in
// particular).
afterEach(async () => {
  const db = getDb();
  for (const c of CATEGORIES) {
    await db
      .update(categories)
      .set({ name: c.name, sortOrder: c.sortOrder })
      .where(eq(categories.slug, c.slug));
  }
});

function patchReq(body: unknown) {
  return new Request("http://localhost/", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function findCategoryId(slug: string): Promise<string> {
  const [row] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row!.id;
}

describe("PATCH /api/admin/categories/[id]", () => {
  it("updates name when provided", async () => {
    const id = await findCategoryId("ai-in-tech");
    const res = await PATCH(patchReq({ name: "Tech (renamed)" }), {
      params: Promise.resolve({ id }),
    });
    expect(res.status).toBe(200);
    const [row] = await getDb()
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    expect(row?.name).toBe("Tech (renamed)");
  });

  it("updates sort_order when provided", async () => {
    const id = await findCategoryId("ai-in-finance");
    const res = await PATCH(patchReq({ sort_order: 5 }), {
      params: Promise.resolve({ id }),
    });
    expect(res.status).toBe(200);
    const [row] = await getDb()
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    expect(row?.sortOrder).toBe(5);
  });

  it("400s when slug is in the body", async () => {
    const id = await findCategoryId("ai-in-tech");
    const res = await PATCH(
      patchReq({ name: "x", slug: "different-slug" }),
      { params: Promise.resolve({ id }) },
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/slug is immutable/);
  });

  it("404s for an unknown id", async () => {
    const res = await PATCH(patchReq({ name: "x" }), {
      params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });
});

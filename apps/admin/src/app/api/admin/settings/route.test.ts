import { beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { adminSettings, getDb } from "@armal/shared/db";
import { PATCH } from "./[key]/route";

function patchReq(body: unknown) {
  return new Request("http://localhost/", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  await getDb().execute(sql`TRUNCATE TABLE admin_settings`);
});

describe("PATCH /api/admin/settings/[key]", () => {
  it("upserts a setting with an arbitrary JSON value", async () => {
    const res = await PATCH(
      patchReq({
        value: {
          pollIntervalMinutes: 15,
          rssSourceUrls: ["https://feeds.example/a", "https://feeds.example/b"],
          autoDraftThreshold: 0.72,
        },
      }),
      { params: Promise.resolve({ key: "ingestion" }) },
    );
    expect(res.status).toBe(200);
    const rows = await getDb().select().from(adminSettings);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.key).toBe("ingestion");
    expect((rows[0]?.value as { pollIntervalMinutes: number }).pollIntervalMinutes)
      .toBe(15);
  });

  it("overwrites an existing setting on the second PATCH", async () => {
    await PATCH(patchReq({ value: { email: "a@x.com" } }), {
      params: Promise.resolve({ key: "auth" }),
    });
    await PATCH(patchReq({ value: { email: "b@x.com" } }), {
      params: Promise.resolve({ key: "auth" }),
    });
    const rows = await getDb().select().from(adminSettings);
    expect(rows).toHaveLength(1);
    expect((rows[0]?.value as { email: string }).email).toBe("b@x.com");
  });

  it("400s on an invalid key shape", async () => {
    const res = await PATCH(patchReq({ value: 1 }), {
      params: Promise.resolve({ key: "../etc/passwd" }),
    });
    expect(res.status).toBe(400);
  });

  it("400s when the body is missing `value`", async () => {
    const res = await PATCH(patchReq({}), {
      params: Promise.resolve({ key: "auth" }),
    });
    expect(res.status).toBe(400);
  });
});

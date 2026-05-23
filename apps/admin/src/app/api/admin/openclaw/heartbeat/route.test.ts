import { beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { adminSettings, getDb } from "@armal/shared/db";
import {
  OpenClawHealth,
  type OpenClawHealth as OpenClawHealthType,
} from "@armal/shared/validation/admin-settings";
import { POST } from "./route";

function postReq(body: unknown) {
  return new Request("http://localhost/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  await getDb().execute(sql`TRUNCATE TABLE admin_settings`);
});

describe("POST /api/admin/openclaw/heartbeat", () => {
  it("writes a heartbeat row that matches the OpenClawHealth schema", async () => {
    const res = await POST(postReq({ status: "ok" }));
    expect(res.status).toBe(200);
    const rows = await getDb().select().from(adminSettings);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.key).toBe("openclaw_health");
    const parsed = OpenClawHealth.parse(rows[0]?.value);
    expect(parsed.lastIngestStatus).toBe("ok");
    expect(parsed.lastSeen).toBeDefined();
    expect(parsed.lastIngestMessage).toBeUndefined();
  });

  it("stores the optional message when provided", async () => {
    await POST(postReq({ status: "error", message: "feed timed out" }));
    const rows = await getDb().select().from(adminSettings);
    const parsed = OpenClawHealth.parse(rows[0]?.value);
    expect(parsed.lastIngestStatus).toBe("error");
    expect(parsed.lastIngestMessage).toBe("feed timed out");
  });

  it("overwrites the previous heartbeat on a second post", async () => {
    await POST(postReq({ status: "ok" }));
    await new Promise((r) => setTimeout(r, 5));
    await POST(postReq({ status: "error", message: "no feeds reachable" }));
    const rows = await getDb().select().from(adminSettings);
    expect(rows).toHaveLength(1);
    const parsed = OpenClawHealth.parse(rows[0]?.value) as OpenClawHealthType;
    expect(parsed.lastIngestStatus).toBe("error");
    expect(parsed.lastIngestMessage).toBe("no feeds reachable");
  });

  it("400s on an unknown status", async () => {
    const res = await POST(postReq({ status: "pending" }));
    expect(res.status).toBe(400);
  });

  it("400s on invalid JSON", async () => {
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

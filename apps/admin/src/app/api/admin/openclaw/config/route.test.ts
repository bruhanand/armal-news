import { beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "@armal/shared/db";
import { upsertAdminSetting } from "@armal/shared/db/queries";
import { GET } from "./route";

beforeEach(async () => {
  await getDb().execute(sql`TRUNCATE TABLE admin_settings`);
});

const configA = {
  pollIntervalMinutes: 15,
  rssSourceUrls: ["https://feeds.example/a"],
  autoDraftThreshold: 0.72,
};
const configB = {
  pollIntervalMinutes: 5,
  rssSourceUrls: ["https://feeds.example/a", "https://feeds.example/b"],
  autoDraftThreshold: 0.5,
};

describe("GET /api/admin/openclaw/config", () => {
  it("returns null config when no settings have been saved", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ version: null, config: null });
  });

  it("returns the saved ingestion config plus a version", async () => {
    await upsertAdminSetting("ingestion", configA);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config).toEqual(configA);
    expect(typeof body.version).toBe("string");
    // ISO-8601
    expect(Number.isNaN(Date.parse(body.version))).toBe(false);
  });

  it("returns B with a newer version after a second write", async () => {
    await upsertAdminSetting("ingestion", configA);
    const first = await GET().then((r) => r.json());

    // Force a measurable gap so updatedAt strictly increases. The PATCH path
    // calls `new Date()` directly, so a 5ms gap is enough on every platform
    // we care about.
    await new Promise((r) => setTimeout(r, 5));

    await upsertAdminSetting("ingestion", configB);
    const second = await GET().then((r) => r.json());

    expect(second.config).toEqual(configB);
    expect(Date.parse(second.version)).toBeGreaterThan(
      Date.parse(first.version),
    );
  });

  it("ignores other admin_settings keys", async () => {
    await upsertAdminSetting("auth", { email: "a@x.com" });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ version: null, config: null });
  });
});

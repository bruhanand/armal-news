import { describe, expect, it } from "vitest";
import { IngestionConfig, OpenClawHealth } from "./admin-settings";

const validIngestion = {
  pollIntervalMinutes: 15,
  rssSourceUrls: ["https://feeds.example/a", "https://feeds.example/b"],
  autoDraftThreshold: 0.72,
};

describe("IngestionConfig", () => {
  it("accepts a valid payload", () => {
    expect(IngestionConfig.parse(validIngestion)).toEqual(validIngestion);
  });

  it("accepts an empty rssSourceUrls list", () => {
    expect(
      IngestionConfig.parse({ ...validIngestion, rssSourceUrls: [] }),
    ).toEqual({ ...validIngestion, rssSourceUrls: [] });
  });

  it("rejects a non-integer poll interval", () => {
    expect(
      IngestionConfig.safeParse({ ...validIngestion, pollIntervalMinutes: 1.5 })
        .success,
    ).toBe(false);
  });

  it("rejects a zero or negative poll interval", () => {
    expect(
      IngestionConfig.safeParse({ ...validIngestion, pollIntervalMinutes: 0 })
        .success,
    ).toBe(false);
    expect(
      IngestionConfig.safeParse({ ...validIngestion, pollIntervalMinutes: -5 })
        .success,
    ).toBe(false);
  });

  it("rejects an auto-draft threshold outside 0..1", () => {
    expect(
      IngestionConfig.safeParse({ ...validIngestion, autoDraftThreshold: 1.1 })
        .success,
    ).toBe(false);
    expect(
      IngestionConfig.safeParse({ ...validIngestion, autoDraftThreshold: -0.1 })
        .success,
    ).toBe(false);
  });

  it("rejects an RSS URL that is not http(s)", () => {
    expect(
      IngestionConfig.safeParse({
        ...validIngestion,
        rssSourceUrls: ["javascript:alert(1)"],
      }).success,
    ).toBe(false);
    expect(
      IngestionConfig.safeParse({
        ...validIngestion,
        rssSourceUrls: ["ftp://example.com/feed"],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown key (strict)", () => {
    expect(
      IngestionConfig.safeParse({ ...validIngestion, surprise: 1 }).success,
    ).toBe(false);
  });
});

describe("OpenClawHealth", () => {
  const validHealth = {
    lastSeen: "2026-05-23T12:00:00.000Z",
    lastIngestStatus: "ok" as const,
  };

  it("accepts a valid payload", () => {
    expect(OpenClawHealth.parse(validHealth)).toEqual(validHealth);
  });

  it("accepts an optional lastIngestMessage", () => {
    const v = { ...validHealth, lastIngestMessage: "fetched 4 stories" };
    expect(OpenClawHealth.parse(v)).toEqual(v);
  });

  it("rejects a non-ISO lastSeen", () => {
    expect(
      OpenClawHealth.safeParse({ ...validHealth, lastSeen: "yesterday" })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown status value", () => {
    expect(
      OpenClawHealth.safeParse({ ...validHealth, lastIngestStatus: "pending" })
        .success,
    ).toBe(false);
  });
});

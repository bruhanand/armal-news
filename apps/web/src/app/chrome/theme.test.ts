import { describe, expect, it } from "vitest";
import { isThemeChoice, nextThemeChoice } from "./theme";

describe("isThemeChoice", () => {
  it("accepts the three valid choices", () => {
    expect(isThemeChoice("system")).toBe(true);
    expect(isThemeChoice("light")).toBe(true);
    expect(isThemeChoice("dark")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isThemeChoice("auto")).toBe(false);
    expect(isThemeChoice(null)).toBe(false);
    expect(isThemeChoice(undefined)).toBe(false);
    expect(isThemeChoice("")).toBe(false);
  });
});

describe("nextThemeChoice", () => {
  it("cycles system → light → dark → system", () => {
    expect(nextThemeChoice("system")).toBe("light");
    expect(nextThemeChoice("light")).toBe("dark");
    expect(nextThemeChoice("dark")).toBe("system");
  });
});

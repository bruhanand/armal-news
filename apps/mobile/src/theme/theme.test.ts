import { describe, expect, it } from "vitest";
import {
  isThemeChoice,
  nextThemeChoice,
  resolveTheme,
} from "./choice";

describe("theme", () => {
  it("cycles system → light → dark → system", () => {
    expect(nextThemeChoice("system")).toBe("light");
    expect(nextThemeChoice("light")).toBe("dark");
    expect(nextThemeChoice("dark")).toBe("system");
  });

  it("resolveTheme honours the manual override", () => {
    expect(resolveTheme("light", "dark")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");
  });

  it("resolveTheme falls back to the system scheme on 'system'", () => {
    expect(resolveTheme("system", "light")).toBe("light");
    expect(resolveTheme("system", "dark")).toBe("dark");
  });

  it("isThemeChoice accepts the three valid choices and rejects others", () => {
    expect(isThemeChoice("system")).toBe(true);
    expect(isThemeChoice("light")).toBe(true);
    expect(isThemeChoice("dark")).toBe(true);
    expect(isThemeChoice("auto")).toBe(false);
    expect(isThemeChoice(null)).toBe(false);
  });
});

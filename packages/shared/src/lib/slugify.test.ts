import { describe, expect, it } from "vitest";
import { resolveSlug, slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates plain ASCII", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics from accented characters", () => {
    expect(slugify("Café résumé")).toBe("cafe-resume");
    expect(slugify("naïve façade")).toBe("naive-facade");
    expect(slugify("Über Ångström")).toBe("uber-angstrom");
  });

  it("removes emoji and other non-alphanumerics", () => {
    expect(slugify("AI in 🤖 robotics 🎉")).toBe("ai-in-robotics");
  });

  it("collapses repeated separators", () => {
    expect(slugify("foo   ---   bar")).toBe("foo-bar");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --hello world--  ")).toBe("hello-world");
  });

  it("caps length at 80 chars and trims trailing hyphen if cap lands on one", () => {
    const long = "a".repeat(40) + " " + "b".repeat(40) + " " + "c".repeat(40);
    const slug = slugify(long);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("returns empty string for input with no slug-able characters", () => {
    expect(slugify("🤖🎉")).toBe("");
  });
});

describe("resolveSlug", () => {
  it("returns the base slug when nothing is taken", async () => {
    const slug = await resolveSlug("Foo Bar", async () => false);
    expect(slug).toBe("foo-bar");
  });

  it("appends -2, -3, ... on collision", async () => {
    const taken = new Set(["foo"]);
    const first = await resolveSlug("Foo", async (s) => taken.has(s));
    expect(first).toBe("foo-2");
    taken.add(first);
    const second = await resolveSlug("Foo", async (s) => taken.has(s));
    expect(second).toBe("foo-3");
    taken.add(second);
    const third = await resolveSlug("Foo", async (s) => taken.has(s));
    expect(third).toBe("foo-4");
  });

  it("does not skip suffixes when -2 is free but base is taken", async () => {
    const taken = new Set(["foo", "foo-3"]);
    const slug = await resolveSlug("Foo", async (s) => taken.has(s));
    expect(slug).toBe("foo-2");
  });
});

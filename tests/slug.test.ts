import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "../src/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("collapses non-alphanumerics and trims hyphens", () => {
    expect(slugify("  A — B!! C  ")).toBe("a-b-c");
  });
  it("makes punctuation-only input empty", () => {
    expect(slugify("!!!")).toBe("");
  });
  it("keeps existing valid slugs stable", () => {
    expect(slugify("winter-series")).toBe("winter-series");
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(isValidSlug("about-me")).toBe(true);
    expect(isValidSlug("demo")).toBe(true);
    expect(isValidSlug("a1b2")).toBe(true);
  });
  it("rejects empty, leading/trailing/double hyphens, spaces, and caps", () => {
    for (const bad of ["", "-x", "x-", "a--b", "Hello", "a b", "a_b", "café"]) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });
});

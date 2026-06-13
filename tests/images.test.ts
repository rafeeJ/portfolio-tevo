import { describe, expect, it } from "vitest";
import {
  clampWidth,
  imageSrcSet,
  imageUrl,
  negotiateFormat,
  VARIANT_WIDTHS,
} from "../src/images/url";
import { UploadError, validateUpload } from "../src/images/validate";

describe("imageUrl", () => {
  it("builds a width-parameterized /img URL by id", () => {
    expect(imageUrl("abc", 800)).toBe("/img/abc?w=800");
  });

  it("defaults to DEFAULT_IMG_WIDTH", () => {
    expect(imageUrl("abc")).toBe("/img/abc?w=1600");
  });

  it("encodes the id", () => {
    expect(imageUrl("a/b id")).toBe("/img/a%2Fb%20id?w=1600");
  });
});

describe("imageSrcSet", () => {
  it("emits one candidate per variant width with w descriptors", () => {
    const set = imageSrcSet("x");
    expect(set.split(", ")).toHaveLength(VARIANT_WIDTHS.length);
    expect(set).toContain("/img/x?w=480 480w");
    expect(set).toContain("/img/x?w=2400 2400w");
  });
});

describe("clampWidth", () => {
  it("passes a valid width through (rounded)", () => {
    expect(clampWidth(800.4)).toBe(800);
  });
  it("caps at MAX_IMG_WIDTH", () => {
    expect(clampWidth(99999)).toBe(2400);
  });
  it("falls back to default for invalid input", () => {
    expect(clampWidth(NaN)).toBe(1600);
    expect(clampWidth(0)).toBe(1600);
    expect(clampWidth(-5)).toBe(1600);
  });
});

describe("negotiateFormat", () => {
  it("prefers AVIF, then WebP, then JPEG", () => {
    expect(negotiateFormat("image/avif,image/webp,*/*")).toBe("image/avif");
    expect(negotiateFormat("image/webp,*/*")).toBe("image/webp");
    expect(negotiateFormat("*/*")).toBe("image/jpeg");
    expect(negotiateFormat(null)).toBe("image/jpeg");
  });
});

describe("validateUpload", () => {
  const ok = { mime: "image/jpeg", bytes: 1000, width: 800, height: 600 };

  it("accepts a valid image", () => {
    expect(() => validateUpload(ok)).not.toThrow();
  });

  it("rejects an unsupported mime", () => {
    expect(() => validateUpload({ ...ok, mime: "image/gif" })).toThrow(UploadError);
  });

  it("rejects an empty or oversized file", () => {
    expect(() => validateUpload({ ...ok, bytes: 0 })).toThrow(UploadError);
    expect(() => validateUpload({ ...ok, bytes: 60 * 1024 * 1024 })).toThrow(UploadError);
  });

  it("rejects non-positive or absurd dimensions", () => {
    expect(() => validateUpload({ ...ok, width: 0 })).toThrow(UploadError);
    expect(() => validateUpload({ ...ok, height: 99999 })).toThrow(UploadError);
  });
});

import { describe, expect, it } from "vitest";
import { backZ, frontZ } from "../src/editor/zorder";
import type { Block } from "../src/lib/types";

const blocks = (zs: number[]): Block[] =>
  zs.map((z, i) => ({
    id: `b${i}`,
    type: "image",
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    z,
  }));

describe("frontZ / backZ", () => {
  it("defaults to 1 / -1 for an empty canvas", () => {
    expect(frontZ([])).toBe(1);
    expect(backZ([])).toBe(-1);
  });

  it("frontZ clears the highest sibling", () => {
    expect(frontZ(blocks([0, 1, 2]))).toBe(3);
  });

  it("backZ sinks below the lowest sibling", () => {
    expect(backZ(blocks([0, 1, 2]))).toBe(-1);
  });

  it("handles negative z values (just above / below the actual extremes)", () => {
    expect(frontZ(blocks([-5, -2]))).toBe(-1);
    expect(backZ(blocks([-5, -2]))).toBe(-6);
  });
});

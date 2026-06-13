import { describe, expect, it } from "vitest";
import { reflow } from "../src/reflow/reflow";
import type { Block } from "../src/lib/types";

function block(id: string, x: number, y: number): Block {
  return { id, type: "image", x, y, width: 100, height: 100, z: 0 };
}

const order = (blocks: Block[]) => reflow(blocks).map((b) => b.id);

describe("reflow", () => {
  it("returns [] for an empty canvas", () => {
    expect(reflow([])).toEqual([]);
  });

  it("returns a single block unchanged", () => {
    expect(order([block("a", 0, 0)])).toEqual(["a"]);
  });

  it("orders top-to-bottom by y", () => {
    expect(order([block("c", 0, 300), block("a", 0, 0), block("b", 0, 150)])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("stacks side-by-side blocks left-to-right (same y)", () => {
    expect(order([block("right", 800, 100), block("left", 100, 100)])).toEqual([
      "left",
      "right",
    ]);
  });

  it("prioritizes y over x (a lower-left block comes after a higher-right one)", () => {
    expect(order([block("low-left", 0, 500), block("high-right", 900, 50)])).toEqual([
      "high-right",
      "low-left",
    ]);
  });

  it("keeps an already-stacked column in order", () => {
    expect(order([block("a", 0, 0), block("b", 0, 100), block("c", 0, 200)])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("handles an interleaved grid in reading order", () => {
    // two rows of two: (tl,tr) then (bl,br)
    const blocks = [
      block("br", 800, 600),
      block("tl", 0, 0),
      block("bl", 0, 600),
      block("tr", 800, 0),
    ];
    expect(order(blocks)).toEqual(["tl", "tr", "bl", "br"]);
  });

  it("breaks exact (y,x) ties deterministically by id", () => {
    expect(order([block("y", 10, 10), block("x", 10, 10)])).toEqual(["x", "y"]);
  });

  it("orders overlapping blocks by top edge", () => {
    expect(order([block("under", 50, 120), block("over", 0, 100)])).toEqual([
      "over",
      "under",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [block("b", 0, 100), block("a", 0, 0)];
    reflow(input);
    expect(input.map((b) => b.id)).toEqual(["b", "a"]);
  });
});

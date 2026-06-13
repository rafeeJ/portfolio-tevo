import { describe, expect, it } from "vitest";
import { computeAlignment, snapDragResult, snapToGrid } from "../src/editor/snap";
import type { Box } from "../src/editor/geometry";

const box = (x: number, y: number, width = 100, height = 100): Box => ({
  x,
  y,
  width,
  height,
});

describe("snapToGrid", () => {
  it("rounds to the nearest 8px", () => {
    expect(snapToGrid(11)).toBe(8);
    expect(snapToGrid(13)).toBe(16);
    expect(snapToGrid(0)).toBe(0);
    expect(snapToGrid(8)).toBe(8);
  });
});

describe("computeAlignment", () => {
  it("snaps a left edge to a sibling's left edge within threshold", () => {
    const moving = box(103, 500); // left 103, other left 100, diff 3 <= 6
    const a = computeAlignment(moving, [box(100, 0)]);
    expect(a.x).toBe(100);
    expect(a.vLines).toEqual([100]);
  });

  it("snaps centers together", () => {
    // moving center = x+50; other center = 200. want moving.x so center 200 -> x 150
    const a = computeAlignment(box(147, 500), [box(150, 0)]);
    // other center = 200, moving center 147+50=197, diff 3 -> snap x to 150
    expect(a.x).toBe(150);
  });

  it("returns null axis when nothing is within threshold", () => {
    const a = computeAlignment(box(500, 500), [box(100, 100)]);
    expect(a.x).toBeNull();
    expect(a.y).toBeNull();
    expect(a.vLines).toEqual([]);
  });

  it("picks the closest of multiple candidates", () => {
    // other A left 100 (diff 5), other B left 102 (diff 3) -> snaps to 102
    const a = computeAlignment(box(105, 500), [box(100, 0), box(102, 0)]);
    expect(a.x).toBe(102);
  });

  it("aligns on the y axis independently", () => {
    const a = computeAlignment(box(900, 204), [box(0, 200)]);
    expect(a.y).toBe(200);
    expect(a.hLines).toEqual([200]);
  });
});

describe("snapDragResult", () => {
  it("uses alignment when available", () => {
    const r = snapDragResult(box(103, 500), [box(100, 0)]);
    expect(r.x).toBe(100);
    expect(r.vLines).toEqual([100]);
  });

  it("falls back to grid when no alignment", () => {
    const r = snapDragResult(box(105, 503), []);
    expect(r.x).toBe(104); // 105 -> nearest 8 = 104
    expect(r.y).toBe(504); // 503 -> 504
  });
});

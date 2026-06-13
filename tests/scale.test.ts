import { describe, expect, it } from "vitest";
import { canvasHeight, toBoxPercent } from "../src/render/scale";
import { CANVAS_WIDTH, type Block } from "../src/lib/types";

function block(partial: Partial<Block>): Block {
  return {
    id: "b",
    type: "image",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    z: 0,
    ...partial,
  };
}

describe("canvasHeight", () => {
  it("is 0 for an empty canvas", () => {
    expect(canvasHeight([])).toBe(0);
  });

  it("is the lowest block edge (y + height)", () => {
    const blocks = [
      block({ y: 0, height: 200 }),
      block({ y: 300, height: 500 }), // bottom edge 800
      block({ y: 100, height: 100 }),
    ];
    expect(canvasHeight(blocks)).toBe(800);
  });

  it("accounts for tall blocks starting near the top", () => {
    expect(canvasHeight([block({ y: 50, height: 1000 })])).toBe(1050);
  });
});

describe("toBoxPercent", () => {
  it("maps a full-bleed block to 0/0/100/100", () => {
    const h = 900;
    const b = block({ x: 0, y: 0, width: CANVAS_WIDTH, height: h });
    expect(toBoxPercent(b, h)).toEqual({ left: 0, top: 0, width: 100, height: 100 });
  });

  it("maps a half-width block to 50% width", () => {
    const h = 1000;
    const b = block({ x: 0, width: CANVAS_WIDTH / 2, height: h });
    expect(toBoxPercent(b, h).width).toBeCloseTo(50);
  });

  it("maps horizontal position as a fraction of CANVAS_WIDTH", () => {
    const b = block({ x: CANVAS_WIDTH / 4, width: 100 });
    expect(toBoxPercent(b, 1000).left).toBeCloseTo(25);
  });

  it("maps vertical position/size as a fraction of canvas height", () => {
    const h = 2000;
    const b = block({ y: 500, height: 500 });
    const box = toBoxPercent(b, h);
    expect(box.top).toBeCloseTo(25);
    expect(box.height).toBeCloseTo(25);
  });

  it("divides by zero safely on an empty (zero-height) canvas", () => {
    const b = block({ y: 0, height: 0 });
    const box = toBoxPercent(b, 0);
    expect(box.top).toBe(0);
    expect(box.height).toBe(0);
  });

  it("preserves aspect intent: a 720x405 block in a 1440x810 canvas is 50% x 50%", () => {
    const b = block({ x: 0, y: 0, width: 720, height: 405 });
    const box = toBoxPercent(b, 810);
    expect(box.width).toBeCloseTo(50);
    expect(box.height).toBeCloseTo(50);
  });

  it("places a bottom-right quadrant block correctly", () => {
    const h = 1000;
    const b = block({ x: CANVAS_WIDTH / 2, y: 500, width: CANVAS_WIDTH / 2, height: 500 });
    expect(toBoxPercent(b, h)).toEqual({ left: 50, top: 50, width: 50, height: 50 });
  });
});

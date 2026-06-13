import { describe, expect, it } from "vitest";
import {
  applyDrag,
  clampPosition,
  editorCanvasHeight,
  resizeBlock,
  toCanvasDelta,
} from "../src/editor/geometry";
import type { Block } from "../src/lib/types";

const b = (over: Partial<Block> = {}): Block => ({
  id: "b",
  type: "image",
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  z: 0,
  ...over,
});

describe("toCanvasDelta", () => {
  it("divides screen delta by scale", () => {
    expect(toCanvasDelta(100, 50, 0.5)).toEqual({ x: 200, y: 100 });
  });
  it("is identity at scale 1", () => {
    expect(toCanvasDelta(10, -10, 1)).toEqual({ x: 10, y: -10 });
  });
});

describe("clampPosition", () => {
  it("clamps to the top-left origin", () => {
    expect(clampPosition(-50, -20, b(), 2000)).toEqual({ x: 0, y: 0 });
  });
  it("clamps right/bottom so the block stays fully inside", () => {
    // CANVAS_WIDTH 1440, block w200 -> max x 1240; canvasH 1000, h150 -> max y 850
    expect(clampPosition(5000, 5000, b(), 1000)).toEqual({ x: 1240, y: 850 });
  });
  it("rounds to integers", () => {
    expect(clampPosition(10.6, 20.4, b(), 2000)).toEqual({ x: 11, y: 20 });
  });
});

describe("applyDrag", () => {
  it("moves a block by the scaled delta", () => {
    // scale 0.5 -> screen (100,50) = canvas (200,100); from (100,100) -> (300,200)
    expect(applyDrag(b(), 100, 50, 0.5, 2000)).toEqual({ x: 300, y: 200 });
  });
  it("clamps the result within the canvas", () => {
    expect(applyDrag(b({ x: 1200 }), 1000, 0, 1, 2000)).toEqual({ x: 1240, y: 100 });
  });
});

describe("resizeBlock", () => {
  const img = b({ x: 100, y: 100, width: 200, height: 100 }); // aspect 2:1

  it("se corner grows width/height, anchored at top-left (no aspect lock)", () => {
    // scale 1, drag se by (+100, +50): w 200->300, h 100->150, x/y fixed
    expect(resizeBlock(img, "se", 100, 50, 1, 2000, false)).toEqual({
      x: 100,
      y: 100,
      width: 300,
      height: 150,
    });
  });

  it("locks aspect for images (height follows width)", () => {
    // se +100 width -> 300; aspect 2:1 -> height 150
    expect(resizeBlock(img, "se", 100, 0, 1, 2000, true)).toEqual({
      x: 100,
      y: 100,
      width: 300,
      height: 150,
    });
  });

  it("nw corner moves the origin and resizes, anchored at bottom-right", () => {
    // anchor = (300,200). drag nw by (-50,-25): new x=50,y=75,w=250,h=125
    expect(resizeBlock(img, "nw", -50, -25, 1, 2000, false)).toEqual({
      x: 50,
      y: 75,
      width: 250,
      height: 125,
    });
  });

  it("enforces a minimum size", () => {
    const r = resizeBlock(img, "se", -1000, -1000, 1, 2000, false);
    expect(r.width).toBeGreaterThanOrEqual(24);
    expect(r.height).toBeGreaterThanOrEqual(24);
  });

  it("applies the screen->canvas scale to the delta", () => {
    // scale 0.5 -> screen +50 = canvas +100 width
    expect(resizeBlock(img, "se", 50, 0, 0.5, 2000, false).width).toBe(300);
  });
});

describe("editorCanvasHeight", () => {
  it("uses the minimum when content is short", () => {
    expect(editorCanvasHeight([b({ y: 0, height: 100 })])).toBe(1400);
  });
  it("grows with headroom for tall content", () => {
    // content bottom 1800 + headroom 400 = 2200
    expect(editorCanvasHeight([b({ y: 1700, height: 100 })])).toBe(2200);
  });
});

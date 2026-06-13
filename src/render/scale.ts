// Pure coordinate math for rendering the fixed-width canvas responsively.
// No DOM, no React — unit-tested in isolation (tests/scale.test.ts).

import { CANVAS_WIDTH, type Block } from "../lib/types";

/** Total canvas height = the lowest block edge. Empty canvas has height 0. */
export function canvasHeight(blocks: Block[]): number {
  return blocks.reduce((h, b) => Math.max(h, b.y + b.height), 0);
}

export interface BoxPercent {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The id of the topmost-leftmost image block — the likely LCP / "hero" image,
 *  which we load eagerly while the rest lazy-load. Null if there are no images. */
export function priorityImageId(blocks: Block[]): string | null {
  let hero: Block | null = null;
  for (const b of blocks) {
    if (b.type !== "image") continue;
    if (!hero || b.y < hero.y || (b.y === hero.y && b.x < hero.x)) hero = b;
  }
  return hero?.id ?? null;
}

/** Responsive `sizes` for a canvas image whose box spans `widthPercent` of the
 *  canvas. Capped at the box's render width at full canvas size, so wide viewports
 *  don't request (and transform) variants larger than the canvas ever renders. */
export function imageSizes(widthPercent: number, canvasW: number = CANVAS_WIDTH): string {
  return `min(${Math.round(widthPercent)}vw, ${Math.round((widthPercent / 100) * canvasW)}px)`;
}

/**
 * Convert a block's absolute canvas coordinates into percentages of the canvas
 * box. Rendering the canvas at `aspect-ratio: canvasW / canvasH` and positioning
 * children by these percentages makes the whole layout scale with pure CSS.
 */
export function toBoxPercent(
  b: Block,
  canvasH: number,
  canvasW: number = CANVAS_WIDTH,
): BoxPercent {
  return {
    left: (b.x / canvasW) * 100,
    top: canvasH === 0 ? 0 : (b.y / canvasH) * 100,
    width: (b.width / canvasW) * 100,
    height: canvasH === 0 ? 0 : (b.height / canvasH) * 100,
  };
}

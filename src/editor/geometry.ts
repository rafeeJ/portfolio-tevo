// Pure geometry for the editor canvas: screen<->canvas coordinate conversion,
// bounds clamping, and the working canvas height. No DOM/React — unit-tested.
import { CANVAS_WIDTH, type Block } from "../lib/types";
import { canvasHeight } from "../render/scale";

export const CANVAS_MIN_HEIGHT = 1400;
export const DRAG_HEADROOM = 400;

/** Working canvas height while editing: fits content plus headroom to drag into. */
export function editorCanvasHeight(blocks: Block[]): number {
  return Math.max(CANVAS_MIN_HEIGHT, Math.ceil(canvasHeight(blocks)) + DRAG_HEADROOM);
}

export interface Point {
  x: number;
  y: number;
}

/** A screen-pixel delta becomes a canvas-coordinate delta at the display scale. */
export function toCanvasDelta(screenDx: number, screenDy: number, scale: number): Point {
  return { x: screenDx / scale, y: screenDy / scale };
}

/** Clamp a block's top-left so the whole block stays within the canvas. */
export function clampPosition(
  x: number,
  y: number,
  block: Block,
  canvasH: number,
): Point {
  return {
    x: Math.round(Math.max(0, Math.min(x, CANVAS_WIDTH - block.width))),
    y: Math.round(Math.max(0, Math.min(y, canvasH - block.height))),
  };
}

/** New clamped top-left for a block after a screen-space drag. */
export function applyDrag(
  block: Block,
  screenDx: number,
  screenDy: number,
  scale: number,
  canvasH: number,
): Point {
  const d = toCanvasDelta(screenDx, screenDy, scale);
  return clampPosition(block.x + d.x, block.y + d.y, block, canvasH);
}

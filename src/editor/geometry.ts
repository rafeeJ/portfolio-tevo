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

export type Corner = "nw" | "ne" | "sw" | "se";
export const MIN_BLOCK_SIZE = 24;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The corner that stays fixed while the opposite corner is dragged. */
function anchorOf(block: Block, corner: Corner): Point {
  const east = corner.includes("e");
  const south = corner.includes("s");
  return {
    x: east ? block.x : block.x + block.width,
    y: south ? block.y : block.y + block.height,
  };
}

/**
 * Resize a block by dragging a corner handle. The opposite corner is anchored.
 * `lockAspect` (images) drives height from width to preserve the original ratio.
 * Result is min-sized, clamped within the canvas, and integer-rounded.
 */
export function resizeBlock(
  block: Block,
  corner: Corner,
  screenDx: number,
  screenDy: number,
  scale: number,
  canvasH: number,
  lockAspect: boolean,
): Box {
  const d = toCanvasDelta(screenDx, screenDy, scale);
  const anchor = anchorOf(block, corner);
  const east = corner.includes("e");
  const south = corner.includes("s");
  const draggedX = (east ? block.x + block.width : block.x) + d.x;
  const draggedY = (south ? block.y + block.height : block.y) + d.y;

  const aspect = block.width / block.height;
  let width = Math.max(MIN_BLOCK_SIZE, Math.abs(draggedX - anchor.x));
  let height = lockAspect
    ? width / aspect
    : Math.max(MIN_BLOCK_SIZE, Math.abs(draggedY - anchor.y));

  let x = east ? anchor.x : anchor.x - width;
  let y = south ? anchor.y : anchor.y - height;

  // Keep the box on-canvas; shrink (preserving aspect when locked) if it spills.
  x = Math.max(0, x);
  y = Math.max(0, y);
  width = Math.min(width, CANVAS_WIDTH - x);
  height = Math.min(height, canvasH - y);
  if (lockAspect) {
    if (width / height > aspect) width = height * aspect;
    else height = width / aspect;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(Math.max(MIN_BLOCK_SIZE, width)),
    height: Math.round(Math.max(MIN_BLOCK_SIZE, height)),
  };
}

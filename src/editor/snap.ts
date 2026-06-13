// Pure snapping math for the editor: 8px grid + smart alignment to sibling
// edges/centers. No DOM/React — unit-tested in tests/snap.test.ts.
import type { Box } from "./geometry";

export const GRID = 8;
export const SNAP_THRESHOLD = 6;

export function snapToGrid(value: number, grid: number = GRID): number {
  return Math.round(value / grid) * grid;
}

// Snap anchors along each axis: near edge, center, far edge.
const xAnchors = (b: Box) => [b.x, b.x + b.width / 2, b.x + b.width];
const yAnchors = (b: Box) => [b.y, b.y + b.height / 2, b.y + b.height];

export interface Alignment {
  /** Snapped top-left coordinate when an alignment was found, else null. */
  x: number | null;
  y: number | null;
  /** Canvas coordinates at which to draw guide lines. */
  vLines: number[];
  hLines: number[];
}

/**
 * Find the closest alignment of `moving`'s edges/center to any sibling's
 * edges/center, within `threshold`. Returns the snapped position + guide lines.
 */
export function computeAlignment(
  moving: Box,
  others: Box[],
  threshold: number = SNAP_THRESHOLD,
): Alignment {
  let bestX: { shift: number; line: number } | null = null;
  let bestY: { shift: number; line: number } | null = null;
  const mx = xAnchors(moving);
  const my = yAnchors(moving);

  for (const o of others) {
    for (const oa of xAnchors(o)) {
      for (const m of mx) {
        const shift = oa - m;
        if (Math.abs(shift) <= threshold && (!bestX || Math.abs(shift) < Math.abs(bestX.shift))) {
          bestX = { shift, line: oa };
        }
      }
    }
    for (const ob of yAnchors(o)) {
      for (const m of my) {
        const shift = ob - m;
        if (Math.abs(shift) <= threshold && (!bestY || Math.abs(shift) < Math.abs(bestY.shift))) {
          bestY = { shift, line: ob };
        }
      }
    }
  }

  return {
    x: bestX ? Math.round(moving.x + bestX.shift) : null,
    y: bestY ? Math.round(moving.y + bestY.shift) : null,
    vLines: bestX ? [bestX.line] : [],
    hLines: bestY ? [bestY.line] : [],
  };
}

export interface SnapResult {
  x: number;
  y: number;
  vLines: number[];
  hLines: number[];
}

/** Final snapped position: alignment takes priority, grid is the fallback per axis. */
export function snapDragResult(moving: Box, others: Box[]): SnapResult {
  const align = computeAlignment(moving, others);
  return {
    x: align.x ?? snapToGrid(moving.x),
    y: align.y ?? snapToGrid(moving.y),
    vLines: align.vLines,
    hLines: align.hLines,
  };
}

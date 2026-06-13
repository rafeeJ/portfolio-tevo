// Auto-reflow: order freeform desktop blocks into a single mobile column.
// Pure and deterministic — unit-tested in tests/reflow.test.ts.
//
// Sorting by (y, then x) reproduces natural reading order, top-to-bottom then
// left-to-right, so side-by-side desktop blocks stack in that order on mobile.
// id is the final tie-break for stability. The single-column LAYOUT itself
// (full width, aspect-preserved images, readable text) is the renderer's job —
// see render/mobile-stack.tsx.
import type { Block } from "../lib/types";

export function reflow(blocks: Block[]): Block[] {
  return [...blocks].sort(
    (a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id),
  );
}

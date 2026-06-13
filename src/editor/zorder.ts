// Pure z-order helpers. "Bring to front" / "send to back" pick a z just beyond
// the current extremes so the block clears (or sinks below) every sibling.
import type { Block } from "../lib/types";

export function frontZ(blocks: Block[]): number {
  if (blocks.length === 0) return 1;
  return Math.max(...blocks.map((b) => b.z)) + 1;
}

export function backZ(blocks: Block[]): number {
  if (blocks.length === 0) return -1;
  return Math.min(...blocks.map((b) => b.z)) - 1;
}

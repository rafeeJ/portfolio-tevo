// Maps a persisted DB row onto the render-model Block.
import type { BlockRow } from "../db/schema";
import type { Block, TextAlign } from "./types";

const ALIGNS: ReadonlySet<string> = new Set(["left", "center", "right"]);

function parseAlign(style: string | null): TextAlign | undefined {
  if (!style) return undefined;
  // `style` is JSON we wrote ourselves; guard only against malformed/legacy rows
  // so one bad row can't throw and blank the whole page render.
  try {
    const a = (JSON.parse(style) as { align?: unknown }).align;
    return typeof a === "string" && ALIGNS.has(a) ? (a as TextAlign) : undefined;
  } catch {
    return undefined;
  }
}

export function rowToBlock(row: BlockRow): Block {
  return {
    id: row.id,
    type: row.type,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    z: row.z,
    imageId: row.image_id,
    text: row.text,
    align: parseAlign(row.style),
  };
}

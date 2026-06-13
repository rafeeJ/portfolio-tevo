// Maps between persisted DB rows and the render-model Block.
import type { BlockRow } from "../db/schema";
import type { Block, BlockType, TextAlign } from "./types";

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

/** Persistable shape of a block (column-named), produced for the save endpoint. */
export interface BlockRecord {
  id: string;
  page_id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  image_id: string | null;
  text: string | null;
  style: string | null;
}

export function blockToRecord(block: Block, pageId: string): BlockRecord {
  return {
    id: block.id,
    page_id: pageId,
    type: block.type,
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    z: block.z,
    image_id: block.imageId ?? null,
    text: block.text ?? null,
    style:
      block.type === "image" ? null : JSON.stringify({ align: block.align ?? "left" }),
  };
}

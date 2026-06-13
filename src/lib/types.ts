// Canonical domain types for the canvas + renderer. DB row shapes live in
// src/db/schema.ts and map onto these (see rowToBlock in S1.2).

/** Desktop design width. All block coordinates are expressed against this. */
export const CANVAS_WIDTH = 1440;

export type BlockType = "image" | "heading" | "subheading" | "body";

export type TextAlign = "left" | "center" | "right";

/** A block placed on the fixed-width desktop canvas (render model). */
export interface Block {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  /** Present for type === "image". */
  imageId?: string | null;
  /** Present for text types. */
  text?: string | null;
  align?: TextAlign;
}

/**
 * Text presets (Notion-style). Font sizes are in `cqw` (1cqw = 1% of the canvas
 * container width) so text scales with the canvas under pure CSS. Refined in S10.
 */
export const TEXT_PRESETS = {
  heading: { fontSizeCqw: 4.4, fontWeight: 400, lineHeight: 1.0, font: "var(--font-display)" },
  subheading: { fontSizeCqw: 2.4, fontWeight: 700, lineHeight: 1.15, font: "var(--font-mono)" },
  body: { fontSizeCqw: 1.4, fontWeight: 400, lineHeight: 1.5, font: "var(--font-mono)" },
} as const;

export type TextPresetKey = keyof typeof TEXT_PRESETS;

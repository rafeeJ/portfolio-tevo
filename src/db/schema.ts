// D1 row types — mirror migrations/0001_init.sql. See docs/SPEC.md "Data Model".
// Timestamps are epoch ms; `published` is 0|1 (SQLite has no bool).

export type BlockType = "image" | "heading" | "subheading" | "body";

export interface PageRow {
  id: string;
  parent_id: string | null;
  slug: string;
  title: string;
  sort_order: number;
  published: number;
  created_at: number;
  updated_at: number;
}

export interface ImageRow {
  id: string;
  r2_key: string;
  width: number;
  height: number;
  bytes: number;
  mime: string;
  created_at: number;
}

export interface BlockRow {
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
  /** JSON string, e.g. { "align": "center" } for text presets. */
  style: string | null;
  created_at: number;
  updated_at: number;
}

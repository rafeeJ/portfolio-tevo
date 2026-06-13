// Thin, typed query layer over D1. Functions take a `D1Database` explicitly so
// they're unit/integration-testable without the `cloudflare:workers` import.
// Server functions obtain the binding via `getDb()` (see src/server/env.ts).

import type { BlockRow, ImageRow, PageRow } from "./schema";

/** All pages in deterministic order; the caller groups by parent_id to build the tree. */
export async function listPages(db: D1Database): Promise<PageRow[]> {
  const res = await db
    .prepare("SELECT * FROM pages ORDER BY sort_order, id")
    .all<PageRow>();
  return res.results;
}

export async function getPageBySlug(
  db: D1Database,
  slug: string,
): Promise<PageRow | null> {
  return db.prepare("SELECT * FROM pages WHERE slug = ?").bind(slug).first<PageRow>();
}

export async function getPageById(
  db: D1Database,
  id: string,
): Promise<PageRow | null> {
  return db.prepare("SELECT * FROM pages WHERE id = ?").bind(id).first<PageRow>();
}

export async function getImageById(
  db: D1Database,
  id: string,
): Promise<ImageRow | null> {
  return db.prepare("SELECT * FROM images WHERE id = ?").bind(id).first<ImageRow>();
}

export async function insertImage(db: D1Database, row: ImageRow): Promise<void> {
  await db
    .prepare(
      "INSERT INTO images (id, r2_key, width, height, bytes, mime, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(row.id, row.r2_key, row.width, row.height, row.bytes, row.mime, row.created_at)
    .run();
}

/** All blocks for a page, in stacking order. */
export async function listBlocks(
  db: D1Database,
  pageId: string,
): Promise<BlockRow[]> {
  const res = await db
    .prepare("SELECT * FROM blocks WHERE page_id = ? ORDER BY z")
    .bind(pageId)
    .all<BlockRow>();
  return res.results;
}

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

/** Insert a page, placing it after its current siblings (`parent_id IS ?` is
 *  SQLite null-safe equality, so it matches top-level pages when parent is null). */
export async function insertPage(
  db: D1Database,
  page: Omit<PageRow, "sort_order">,
): Promise<void> {
  const sib = await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM pages WHERE parent_id IS ?")
    .bind(page.parent_id)
    .first<{ next: number }>();
  await db
    .prepare(
      "INSERT INTO pages (id, parent_id, slug, title, sort_order, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      page.id,
      page.parent_id,
      page.slug,
      page.title,
      sib?.next ?? 0,
      page.published,
      page.created_at,
      page.updated_at,
    )
    .run();
}

/** Flip a page's public visibility. `published` is 0|1 (SQLite has no bool). */
export async function setPagePublished(
  db: D1Database,
  id: string,
  published: 0 | 1,
  updatedAt: number,
): Promise<void> {
  await db
    .prepare("UPDATE pages SET published = ?, updated_at = ? WHERE id = ?")
    .bind(published, updatedAt, id)
    .run();
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

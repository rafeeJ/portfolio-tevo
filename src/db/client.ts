// Thin, typed query layer over D1. Functions take a `D1Database` explicitly so
// they're unit/integration-testable without the `cloudflare:workers` import.
// Server functions obtain the binding via `getDb()` (see src/server/env.ts).

import type { BlockRow, PageRow } from "./schema";

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

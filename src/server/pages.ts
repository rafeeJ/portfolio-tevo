// Server functions for public page reads. These always run server-side, so the
// D1 binding (via getDb) is available even during client-side navigation.
import { createServerFn } from "@tanstack/react-start";
import {
  getPageById,
  getPageBySlug,
  listBlocks,
  listPages,
} from "../db/client";
import { rowToBlock } from "../lib/map";
import { getDb } from "./env";
import type { Block } from "../lib/types";
import type { PageRow } from "../db/schema";

export interface PageData {
  page: PageRow;
  blocks: Block[];
}

/** A page plus its blocks (render model). Shared by the public + editor loaders. */
async function pageWithBlocks(
  db: D1Database,
  page: PageRow,
): Promise<PageData> {
  const rows = await listBlocks(db, page.id);
  return { page, blocks: rows.map(rowToBlock) };
}

/** Published pages (flat) for the public browsable index; caller builds the tree. */
export const loadIndex = createServerFn({ method: "GET" }).handler(
  async (): Promise<PageRow[]> => {
    const pages = await listPages(getDb());
    return pages.filter((p) => p.published === 1);
  },
);

export const loadPageBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<PageData | null> => {
    const db = getDb();
    const page = await getPageBySlug(db, slug);
    return page ? pageWithBlocks(db, page) : null;
  });

/** Load a page by id for the admin editor (gated by Cloudflare Access in prod). */
export const loadEditorPage = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<PageData | null> => {
    const db = getDb();
    const page = await getPageById(db, id);
    return page ? pageWithBlocks(db, page) : null;
  });

// Server functions for public page reads. These always run server-side, so the
// D1 binding (via getDb) is available even during client-side navigation.
import { createServerFn } from "@tanstack/react-start";
import { getPageBySlug, listBlocks, listPages } from "../db/client";
import { rowToBlock } from "../lib/map";
import { getDb } from "./env";
import type { Block } from "../lib/types";
import type { PageRow } from "../db/schema";

export interface PageData {
  page: PageRow;
  blocks: Block[];
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
    if (!page) return null;
    const rows = await listBlocks(db, page.id);
    return { page, blocks: rows.map(rowToBlock) };
  });

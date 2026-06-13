// Server functions for public page reads. These always run server-side, so the
// D1 binding (via getDb) is available even during client-side navigation.
import { createServerFn } from "@tanstack/react-start";
import { getPageBySlug, listBlocks } from "../db/client";
import { rowToBlock } from "../lib/map";
import { getDb } from "./env";
import type { Block } from "../lib/types";
import type { PageRow } from "../db/schema";

export interface PageData {
  page: PageRow;
  blocks: Block[];
}

export const loadPageBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<PageData | null> => {
    const db = getDb();
    const page = await getPageBySlug(db, slug);
    if (!page) return null;
    const rows = await listBlocks(db, page.id);
    return { page, blocks: rows.map(rowToBlock) };
  });

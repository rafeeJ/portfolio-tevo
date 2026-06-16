// Server functions for public page reads. These always run server-side, so the
// D1 binding (via getDb) is available even during client-side navigation.
import { createServerFn } from "@tanstack/react-start";
import {
  getPageById,
  getPageBySlug,
  insertPage,
  listBlocks,
  listPages,
  setPagePublished,
} from "../db/client";
import { rowToBlock } from "../lib/map";
import { isValidSlug } from "../lib/slug";
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
    // Unpublished pages are private — invisible to the public even by direct URL.
    return page && page.published === 1 ? pageWithBlocks(db, page) : null;
  });

/** Load a page by id for the admin editor (gated by Cloudflare Access in prod). */
export const loadEditorPage = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<PageData | null> => {
    const db = getDb();
    const page = await getPageById(db, id);
    return page ? pageWithBlocks(db, page) : null;
  });

/** All pages (incl. unpublished) for the admin dashboard; caller builds the tree. */
export const loadAllPages = createServerFn({ method: "GET" }).handler(
  (): Promise<PageRow[]> => listPages(getDb()),
);

export interface CreatePageInput {
  title: string;
  slug: string;
  parentId: string | null;
}

// Create-page is a mutation: its HTTP entry point is the Access-gated
// POST /admin/api/create-page route. Validation + insert live here.
export function validateCreateInput(data: CreatePageInput): CreatePageInput {
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  if (!title) throw new Error("Title is required");
  if (!isValidSlug(data?.slug)) throw new Error("Invalid slug");
  return { title, slug: data.slug, parentId: data.parentId || null };
}

export async function applyCreatePage(
  db: D1Database,
  data: CreatePageInput,
): Promise<{ id: string }> {
  if (await getPageBySlug(db, data.slug)) {
    throw new Error(`Slug "${data.slug}" is already in use`);
  }
  const id = crypto.randomUUID();
  const now = Date.now();
  await insertPage(db, {
    id,
    parent_id: data.parentId,
    slug: data.slug,
    title: data.title,
    published: 1,
    created_at: now,
    updated_at: now,
  });
  return { id };
}

export interface SetPublishedInput {
  pageId: string;
  published: boolean;
}

// Toggling visibility is a mutation: its HTTP entry point is the Access-gated
// POST /admin/api/set-published route. Validation + update live here.
export function validateSetPublishedInput(data: SetPublishedInput): {
  pageId: string;
  published: 0 | 1;
} {
  const pageId = typeof data?.pageId === "string" ? data.pageId : "";
  if (!pageId) throw new Error("pageId is required");
  if (typeof data?.published !== "boolean") {
    throw new Error("published must be a boolean");
  }
  return { pageId, published: data.published ? 1 : 0 };
}

export async function applySetPublished(
  db: D1Database,
  data: SetPublishedInput,
): Promise<{ published: boolean }> {
  const { pageId, published } = validateSetPublishedInput(data);
  if (!(await getPageById(db, pageId))) {
    throw new Error("Page not found");
  }
  await setPagePublished(db, pageId, published, Date.now());
  return { published: published === 1 };
}

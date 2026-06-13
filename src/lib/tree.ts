// Build a nested page tree from a flat row list. Pure — unit-tested in tree.test.ts.
import type { PageRow } from "../db/schema";

export interface TreeNode {
  page: PageRow;
  children: TreeNode[];
}

/**
 * Group pages by parent_id, ordered by sort_order. A page whose parent_id is
 * absent from the set is treated as a root, so filtering (e.g. unpublished
 * parents) can never silently hide its children.
 */
export function buildTree(pages: PageRow[]): TreeNode[] {
  const present = new Set(pages.map((p) => p.id));
  const childrenOf = new Map<string | null, PageRow[]>();
  for (const p of pages) {
    const key =
      p.parent_id !== null && present.has(p.parent_id) ? p.parent_id : null;
    const siblings = childrenOf.get(key) ?? [];
    siblings.push(p);
    childrenOf.set(key, siblings);
  }
  const build = (parentId: string | null): TreeNode[] =>
    (childrenOf.get(parentId) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
      .map((page) => ({ page, children: build(page.id) }));
  return build(null);
}

import { describe, expect, it } from "vitest";
import { buildTree } from "../src/lib/tree";
import type { PageRow } from "../src/db/schema";

function page(id: string, parent_id: string | null, sort_order = 0): PageRow {
  return {
    id,
    parent_id,
    slug: id,
    title: id,
    sort_order,
    published: 1,
    created_at: 0,
    updated_at: 0,
  };
}

describe("buildTree", () => {
  it("returns [] for no pages", () => {
    expect(buildTree([])).toEqual([]);
  });

  it("nests children under their parent", () => {
    const tree = buildTree([page("root", null), page("child", "root")]);
    expect(tree).toHaveLength(1);
    expect(tree[0].page.id).toBe("root");
    expect(tree[0].children.map((n) => n.page.id)).toEqual(["child"]);
  });

  it("orders siblings by sort_order", () => {
    const tree = buildTree([
      page("b", null, 2),
      page("a", null, 1),
      page("c", null, 3),
    ]);
    expect(tree.map((n) => n.page.id)).toEqual(["a", "b", "c"]);
  });

  it("breaks sort_order ties deterministically by id", () => {
    const tree = buildTree([page("y", null, 0), page("x", null, 0)]);
    expect(tree.map((n) => n.page.id)).toEqual(["x", "y"]);
  });

  it("nests multiple levels deep", () => {
    const tree = buildTree([
      page("a", null),
      page("b", "a"),
      page("c", "b"),
    ]);
    expect(tree[0].children[0].children[0].page.id).toBe("c");
  });

  it("treats a page with a missing parent as a root (no silent hiding)", () => {
    const tree = buildTree([page("orphan", "gone")]);
    expect(tree.map((n) => n.page.id)).toEqual(["orphan"]);
  });

  it("keeps a child visible at root when its parent was filtered out", () => {
    // parent 'p' is absent (e.g. unpublished and filtered before buildTree)
    const tree = buildTree([page("kept", "p"), page("top", null)]);
    expect(tree.map((n) => n.page.id).sort()).toEqual(["kept", "top"]);
  });
});

import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { createPage } from "../../lib/admin-api";
import { slugify } from "../../lib/slug";
import { buildTree, type TreeNode } from "../../lib/tree";
import { loadAllPages } from "../../server/pages";

export const Route = createFileRoute("/admin/")({
  loader: () => loadAllPages(),
  component: AdminIndex,
});

function AdminIndex() {
  const pages = Route.useLoaderData();
  const tree = buildTree(pages);
  const navigate = useNavigate();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [parentId, setParentId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onTitle = (value: string) => {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const { id } = await createPage({ title, slug, parentId: parentId || null });
      await router.invalidate();
      navigate({ to: "/admin/p/$id", params: { id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create page");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Pages</h1>

      {tree.length === 0 ? (
        <p className="text-neutral-500">No pages yet — create one below.</p>
      ) : (
        <PageTree nodes={tree} />
      )}

      <form
        onSubmit={submit}
        className="mt-10 space-y-3 rounded-lg border border-neutral-200 p-5"
      >
        <h2 className="text-sm font-semibold">New page</h2>
        <label className="block text-xs text-neutral-600">
          Title
          <input
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            required
          />
        </label>
        <label className="block text-xs text-neutral-600">
          Slug (URL)
          <input
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 font-mono text-sm"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            required
          />
        </label>
        <label className="block text-xs text-neutral-600">
          Parent (optional — makes it a subpage)
          <select
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">— Top level —</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={creating || !title || !slug}
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {creating ? "Creating…" : "Create page"}
        </button>
      </form>
    </main>
  );
}

function PageTree({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.page.id}>
          <Link
            to="/admin/p/$id"
            params={{ id: node.page.id }}
            className="text-sm underline-offset-4 hover:underline"
          >
            {node.page.title}
          </Link>
          <span className="ml-2 font-mono text-xs text-neutral-400">
            /p/{node.page.slug}
          </span>
          {node.children.length > 0 && (
            <div className="mt-1 ml-4 border-l border-neutral-200 pl-3">
              <PageTree nodes={node.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

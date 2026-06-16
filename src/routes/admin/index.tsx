import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { createPage, setPublished } from "../../lib/admin-api";
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
  const [pending, setPending] = useState<Set<string>>(new Set());

  const toggle = async (id: string, next: boolean) => {
    setError(null);
    setPending((prev) => new Set(prev).add(id));
    try {
      await setPublished(id, next);
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update visibility");
    } finally {
      setPending((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  };

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

  const INPUT =
    "mono mt-1.5 w-full border-2 border-ink bg-paper px-2.5 py-2 text-sm outline-none focus:border-hazard";
  const LABEL = "mono block text-[10px] uppercase tracking-wider text-ink-soft";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <p className="mono mb-3 text-[11px] text-ink-soft">[ CONTROL&nbsp;/&nbsp;PAGE&nbsp;REGISTER ]</p>
      <h1 className="display mb-8 text-[clamp(2.5rem,11vw,5rem)]">Pages</h1>

      {tree.length === 0 ? (
        <p className="mono text-sm text-ink-soft">
          <span className="text-hazard">▚</span>&nbsp;&nbsp;NO PAGES — CREATE ONE BELOW.
        </p>
      ) : (
        <PageTree nodes={tree} pending={pending} onToggle={toggle} />
      )}

      <form onSubmit={submit} className="mt-12 space-y-4 border-2 border-ink p-5">
        <h2 className="mono text-[11px] uppercase tracking-wider">
          <span className="text-hazard">+</span>&nbsp;New page
        </h2>
        <label className={LABEL}>
          Title
          <input className={INPUT} value={title} onChange={(e) => onTitle(e.target.value)} required />
        </label>
        <label className={LABEL}>
          Slug (URL)
          <input
            className={INPUT}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            required
          />
        </label>
        <label className={LABEL}>
          Parent — optional, makes it a subpage
          <select
            className={INPUT}
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">— TOP LEVEL —</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p className="mono text-[11px] text-hazard" role="alert">
            ! {error}
          </p>
        )}
        <button
          type="submit"
          disabled={creating || !title || !slug}
          className="mono border-2 border-ink bg-ink px-4 py-2 text-[11px] uppercase tracking-wider text-paper transition-colors disabled:opacity-30 enabled:hover:bg-hazard enabled:hover:border-hazard"
        >
          {creating ? "Creating…" : "Create page ▸"}
        </button>
      </form>
    </main>
  );
}

interface PageTreeProps {
  nodes: TreeNode[];
  pending: Set<string>;
  onToggle: (id: string, next: boolean) => void;
}

function PageTree({ nodes, pending, onToggle }: PageTreeProps) {
  return (
    <ul className="border-t-2 border-ink">
      {nodes.map((node) => {
        const live = node.page.published === 1;
        const busy = pending.has(node.page.id);
        return (
          <li key={node.page.id}>
            <div className="flex items-baseline gap-3 border-b border-ink px-1 py-3 hover:bg-paper-2">
              <Link
                to="/admin/p/$id"
                params={{ id: node.page.id }}
                className="lk flex flex-1 items-baseline justify-between gap-3"
              >
                <span
                  className={`mono text-sm uppercase tracking-wide ${live ? "" : "text-ink-soft line-through"}`}
                >
                  {node.page.title}
                </span>
                <span className="mono text-[10px] text-ink-soft">/p/{node.page.slug}&nbsp;→</span>
              </Link>
              <button
                type="button"
                onClick={() => onToggle(node.page.id, !live)}
                disabled={busy}
                aria-pressed={live}
                title={live ? "Live — click to hide" : "Hidden — click to publish"}
                className={`mono shrink-0 border-2 px-2 py-1 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-30 ${
                  live
                    ? "border-ink bg-ink text-paper enabled:hover:bg-hazard enabled:hover:border-hazard"
                    : "border-ink text-ink-soft enabled:hover:border-hazard enabled:hover:text-hazard"
                }`}
              >
                {busy ? "…" : live ? "● Live" : "○ Hidden"}
              </button>
            </div>
            {node.children.length > 0 && (
              <div className="ml-4 border-l-2 border-hazard pl-3">
                <PageTree nodes={node.children} pending={pending} onToggle={onToggle} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

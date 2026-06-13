import { Link, createFileRoute } from "@tanstack/react-router";
import { buildTree, type TreeNode } from "../lib/tree";
import { loadIndex } from "../server/pages";

export const Route = createFileRoute("/")({
  loader: async () => buildTree(await loadIndex()),
  component: Index,
});

function Index() {
  const tree = Route.useLoaderData();
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Index</h1>
      {tree.length === 0 ? (
        <p className="text-neutral-500">No pages yet.</p>
      ) : (
        <TreeList nodes={tree} />
      )}
    </main>
  );
}

function TreeList({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul className="space-y-2">
      {nodes.map((node) => (
        <li key={node.page.id}>
          <Link
            to="/p/$slug"
            params={{ slug: node.page.slug }}
            className="underline-offset-4 hover:underline"
          >
            {node.page.title}
          </Link>
          {node.children.length > 0 && (
            <div className="mt-2 ml-5 border-l border-neutral-200 pl-4">
              <TreeList nodes={node.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

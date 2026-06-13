import { Link, createFileRoute } from "@tanstack/react-router";
import { buildTree, type TreeNode } from "../lib/tree";
import { loadIndex } from "../server/pages";

export const Route = createFileRoute("/")({
  loader: async () => buildTree(await loadIndex()),
  component: Index,
});

interface Entry {
  id: string;
  title: string;
  slug: string;
  depth: number;
}

function flatten(nodes: TreeNode[], depth = 0, acc: Entry[] = []): Entry[] {
  for (const n of nodes) {
    acc.push({ id: n.page.id, title: n.page.title, slug: n.page.slug, depth });
    flatten(n.children, depth + 1, acc);
  }
  return acc;
}

function Index() {
  const tree = Route.useLoaderData();
  const entries = flatten(tree);

  return (
    <main>
      <section className="border-b-2 border-ink px-4 py-12 sm:px-6">
        <p className="mono mb-4 text-[11px] text-ink-soft">
          [ CATALOGUE&nbsp;/&nbsp;{String(entries.length).padStart(3, "0")}&nbsp;ENTRIES ]
        </p>
        <h1 className="display text-[clamp(3.25rem,17vw,12rem)] text-ink">Works</h1>
      </section>

      {entries.length === 0 ? (
        <p className="mono px-4 py-16 text-sm text-ink-soft sm:px-6">
          <span className="text-hazard">▚</span>&nbsp;&nbsp;NO FRAMES ON RECORD — AWAITING FIRST
          TRANSMISSION.
        </p>
      ) : (
        <ol>
          {entries.map((e, i) => (
            <li key={e.id}>
              <Link
                to="/p/$slug"
                params={{ slug: e.slug }}
                className="lk grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3 border-b border-ink px-4 py-5 hover:bg-paper-2 sm:grid-cols-[3rem_1fr_auto] sm:px-6"
              >
                <span className="mono text-[11px] text-ink-soft tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="display text-xl sm:text-3xl"
                  style={{ paddingLeft: e.depth * 22 }}
                >
                  {e.depth > 0 && <span className="mr-2 text-hazard">└</span>}
                  {e.title}
                </span>
                <span className="mono col-start-2 mt-1 self-center text-[10px] text-ink-soft sm:col-start-3 sm:mt-0">
                  /p/{e.slug}&nbsp;<span className="text-hazard">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

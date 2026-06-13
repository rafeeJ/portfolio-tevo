import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { pipelineImageResolver } from "../render/render-blocks";
import { ResponsiveCanvas } from "../render/responsive-canvas";
import { loadPageBySlug } from "../server/pages";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const data = await loadPageBySlug({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) =>
    loaderData ? { meta: [{ title: `${loaderData.page.title} — TEVO` }] } : {},
  component: PageView,
});

function PageView() {
  const { page, blocks } = Route.useLoaderData();
  const exposures = blocks.filter((b) => b.type === "image").length;
  return (
    <main>
      <section className="border-b-2 border-ink px-4 py-9 sm:px-6">
        <div className="mono mb-4 flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-ink-soft">
          <span>
            <span className="text-hazard">●</span>&nbsp;FRAME&nbsp;SET&nbsp;/&nbsp;/p/{page.slug}
          </span>
          <span>{String(exposures).padStart(2, "0")}&nbsp;EXPOSURES</span>
          <Link to="/" className="lk ml-auto text-ink">
            ←&nbsp;INDEX
          </Link>
        </div>
        <h1 className="display text-[clamp(2.25rem,9vw,6.5rem)]">{page.title}</h1>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6">
        <ResponsiveCanvas blocks={blocks} resolveImage={pipelineImageResolver} />
      </div>
    </main>
  );
}

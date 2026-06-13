import { createFileRoute, notFound } from "@tanstack/react-router";
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
    loaderData ? { meta: [{ title: loaderData.page.title }] } : {},
  component: PageView,
});

function PageView() {
  const { blocks } = Route.useLoaderData();
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-10">
      <ResponsiveCanvas blocks={blocks} resolveImage={pipelineImageResolver} />
    </main>
  );
}

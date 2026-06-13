import { createFileRoute, notFound } from "@tanstack/react-router";
import { CanvasStage } from "../render/render-blocks";
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
      <CanvasStage blocks={blocks} />
    </main>
  );
}

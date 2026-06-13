import { createFileRoute, notFound } from "@tanstack/react-router";
import { imageSrcSet, imageUrl } from "../images/url";
import { ResponsiveCanvas } from "../render/responsive-canvas";
import { loadPageBySlug } from "../server/pages";

const resolveImage = (imageId: string) => ({
  src: imageUrl(imageId),
  srcSet: imageSrcSet(imageId),
});

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
      <ResponsiveCanvas blocks={blocks} resolveImage={resolveImage} />
    </main>
  );
}

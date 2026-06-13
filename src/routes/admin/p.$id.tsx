import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEditorModel } from "../../editor/model";
import { CanvasStage, pipelineImageResolver } from "../../render/render-blocks";
import { loadEditorPage } from "../../server/pages";

export const Route = createFileRoute("/admin/p/$id")({
  loader: async ({ params }) => {
    const data = await loadEditorPage({ data: params.id });
    if (!data) throw notFound();
    return data;
  },
  component: Editor,
});

function Editor() {
  const { page, blocks } = Route.useLoaderData();
  const model = useEditorModel(blocks);
  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-neutral-800">
          Editing: {page.title}
        </span>
        <span className="text-xs text-neutral-400">read-only</span>
      </header>
      <div className="mx-auto max-w-[1440px] p-4">
        <div className="bg-white shadow-sm">
          <CanvasStage blocks={model.blocks} resolveImage={pipelineImageResolver} />
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { EditorCanvas } from "../../editor/EditorCanvas";
import { useEditorModel } from "../../editor/model";
import { backZ, frontZ } from "../../editor/zorder";
import { pipelineImageResolver } from "../../render/render-blocks";
import { saveBlockLayout } from "../../server/blocks";
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
  const [saving, setSaving] = useState(false);
  const [snap, setSnap] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    try {
      await saveBlockLayout({
        data: {
          pageId: page.id,
          blocks: model.blocks.map(({ id, x, y, width, height, z }) => ({
            id,
            x,
            y,
            width,
            height,
            z,
          })),
        },
      });
      model.markSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-neutral-800">
          Editing: {page.title}
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!selectedId}
              onClick={() =>
                selectedId &&
                model.updateBlock(selectedId, { z: frontZ(model.blocks) })
              }
              className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40"
            >
              Bring to front
            </button>
            <button
              type="button"
              disabled={!selectedId}
              onClick={() =>
                selectedId &&
                model.updateBlock(selectedId, { z: backZ(model.blocks) })
              }
              className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40"
            >
              Send to back
            </button>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={snap}
              onChange={(e) => setSnap(e.target.checked)}
            />
            Snap
          </label>
          <span className="text-xs text-neutral-400">
            {model.dirty ? "unsaved changes" : "saved"}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={saving || !model.dirty}
            className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] p-4">
        <EditorCanvas
          blocks={model.blocks}
          resolveImage={pipelineImageResolver}
          onUpdate={model.updateBlock}
          snap={snap}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}

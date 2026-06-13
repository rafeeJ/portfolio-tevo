import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { EditorCanvas } from "../../editor/EditorCanvas";
import { useEditorModel, type TextType } from "../../editor/model";
import { backZ, frontZ } from "../../editor/zorder";
import { blockToRecord } from "../../lib/map";
import type { TextAlign } from "../../lib/types";
import { pipelineImageResolver } from "../../render/render-blocks";
import { savePage } from "../../server/blocks";
import { loadEditorPage } from "../../server/pages";

export const Route = createFileRoute("/admin/p/$id")({
  loader: async ({ params }) => {
    const data = await loadEditorPage({ data: params.id });
    if (!data) throw notFound();
    return data;
  },
  component: Editor,
});

const BTN =
  "rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40 hover:bg-neutral-100";

function Editor() {
  const { page, blocks } = Route.useLoaderData();
  const model = useEditorModel(blocks);
  const [saving, setSaving] = useState(false);
  const [snap, setSnap] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = model.blocks.find((b) => b.id === selectedId) ?? null;
  const textSelected = selected !== null && selected.type !== "image";

  const addText = (type: TextType) => setSelectedId(model.addTextBlock(type));
  const setZ = (z: number) => selectedId && model.updateBlock(selectedId, { z });
  const setAlign = (align: TextAlign) =>
    selectedId && model.updateBlock(selectedId, { align });
  const remove = () => {
    if (!selectedId) return;
    model.deleteBlock(selectedId);
    setSelectedId(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await savePage({
        data: {
          pageId: page.id,
          blocks: model.blocks.map((b) => blockToRecord(b, page.id)),
        },
      });
      model.markSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-neutral-200 bg-white px-4 py-2">
        <span className="text-sm font-medium text-neutral-800">{page.title}</span>

        <div className="flex items-center gap-1">
          <button type="button" className={BTN} onClick={() => addText("heading")}>
            + Heading
          </button>
          <button type="button" className={BTN} onClick={() => addText("subheading")}>
            + Subheading
          </button>
          <button type="button" className={BTN} onClick={() => addText("body")}>
            + Body
          </button>
        </div>

        <div className="flex items-center gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={BTN}
              disabled={!textSelected}
              onClick={() => setAlign(a)}
            >
              {a === "left" ? "⯇" : a === "center" ? "≡" : "⯈"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={BTN}
            disabled={!selectedId}
            onClick={() => setZ(frontZ(model.blocks))}
          >
            Front
          </button>
          <button
            type="button"
            className={BTN}
            disabled={!selectedId}
            onClick={() => setZ(backZ(model.blocks))}
          >
            Back
          </button>
          <button
            type="button"
            className={`${BTN} text-red-600`}
            disabled={!selectedId}
            onClick={remove}
          >
            Delete
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
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

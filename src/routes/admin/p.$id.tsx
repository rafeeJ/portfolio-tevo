import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { EditorCanvas } from "../../editor/EditorCanvas";
import { useEditorModel, type TextType } from "../../editor/model";
import { backZ, frontZ } from "../../editor/zorder";
import { savePage, uploadImage } from "../../lib/admin-api";
import { blockToRecord } from "../../lib/map";
import type { TextAlign } from "../../lib/types";
import { pipelineImageResolver } from "../../render/render-blocks";
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
  "mono border-2 border-ink px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-30 enabled:hover:bg-ink enabled:hover:text-paper";

function Editor() {
  const { page, blocks } = Route.useLoaderData();
  const model = useEditorModel(blocks);
  const [saving, setSaving] = useState(false);
  const [snap, setSnap] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = model.blocks.find((b) => b.id === selectedId) ?? null;
  const textSelected = selected !== null && selected.type !== "image";

  const addText = (type: TextType) => {
    model.checkpoint();
    setSelectedId(model.addTextBlock(type));
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const img = await uploadImage(file);
      model.checkpoint();
      setSelectedId(model.addImageBlock(img.id, img.width, img.height));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const setZ = (z: number) => {
    if (!selectedId) return;
    model.checkpoint();
    model.updateBlock(selectedId, { z });
  };
  const setAlign = (align: TextAlign) => {
    if (!selectedId) return;
    model.checkpoint();
    model.updateBlock(selectedId, { align });
  };
  const remove = () => {
    if (!selectedId) return;
    model.checkpoint();
    model.deleteBlock(selectedId);
    setSelectedId(null);
  };

  // Keyboard undo/redo, except while editing text (let the field handle it).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLElement && el.isContentEditable) return;
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) model.redo();
      else model.undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [model]);

  const save = async () => {
    setSaving(true);
    try {
      await savePage({
        pageId: page.id,
        blocks: model.blocks.map((b) => blockToRecord(b, page.id)),
      });
      model.markSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-ink bg-paper px-4 py-2">
        <span className="mono mr-1 text-[11px] uppercase">
          <span className="text-hazard">▌</span>&nbsp;EDIT&nbsp;/&nbsp;{page.title}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={BTN}
            disabled={!model.canUndo}
            onClick={model.undo}
            title="Undo (⌘Z)"
          >
            Undo
          </button>
          <button
            type="button"
            className={BTN}
            disabled={!model.canRedo}
            onClick={model.redo}
            title="Redo (⌘⇧Z)"
          >
            Redo
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={BTN}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Uploading…" : "+ Photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            hidden
            onChange={onPickFile}
          />
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
            className={`${BTN} border-hazard text-hazard enabled:hover:!bg-hazard enabled:hover:!text-paper`}
            disabled={!selectedId}
            onClick={remove}
          >
            Delete
          </button>
        </div>

        <div className="mono ml-auto flex items-center gap-3 text-[10px] uppercase">
          {uploadError && (
            <span className="text-hazard" role="alert">
              ! {uploadError}
            </span>
          )}
          <label className="flex items-center gap-1.5 tracking-wider text-ink-soft">
            <input
              type="checkbox"
              checked={snap}
              onChange={(e) => setSnap(e.target.checked)}
              className="accent-hazard"
            />
            Snap
          </label>
          <span className={model.dirty ? "text-hazard" : "text-ink-soft"}>
            {model.dirty ? "● UNSAVED" : "○ SAVED"}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={saving || !model.dirty}
            className="mono border-2 border-ink bg-ink px-3 py-1.5 text-[11px] uppercase tracking-wider text-paper transition-colors disabled:opacity-30 enabled:hover:bg-hazard enabled:hover:border-hazard"
          >
            {saving ? "Saving…" : "Save ▸"}
          </button>
        </div>
      </header>

      <div className="bg-paper-2 px-4 py-6">
        <div className="mx-auto max-w-[1440px] border-2 border-ink bg-paper p-4">
        <EditorCanvas
          blocks={model.blocks}
          resolveImage={pipelineImageResolver}
          onUpdate={model.updateBlock}
          onCheckpoint={model.checkpoint}
          snap={snap}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        </div>
      </div>
    </div>
  );
}

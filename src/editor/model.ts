// The editor's app-owned layout model — the single source of truth for blocks
// while editing, wrapped in an undo/redo history. dnd-kit / resize handles /
// toolbar feed mutations here; the DOM is never authoritative. `dirty` tracks
// unsaved changes. Callers `checkpoint()` at gesture boundaries (see history.ts).
import { useCallback, useState } from "react";
import type { Block } from "../lib/types";
import {
  canRedo,
  canUndo,
  checkpoint as hCheckpoint,
  initHistory,
  redo as hRedo,
  setPresent,
  undo as hUndo,
  type History,
} from "./history";
import { frontZ } from "./zorder";

export type TextType = "heading" | "subheading" | "body";

const TEXT_DEFAULTS: Record<TextType, { width: number; height: number; text: string }> = {
  heading: { width: 800, height: 96, text: "Heading" },
  subheading: { width: 640, height: 60, text: "Subheading" },
  body: { width: 520, height: 140, text: "Body text" },
};

const IMAGE_DEFAULT_WIDTH = 600;

export interface EditorModel {
  blocks: Block[];
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  addTextBlock: (type: TextType) => string;
  addImageBlock: (imageId: string, intrinsicW: number, intrinsicH: number) => string;
  deleteBlock: (id: string) => void;
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
}

export function useEditorModel(initial: Block[]): EditorModel {
  const [hist, setHist] = useState<History<Block[]>>(() => initHistory(initial));
  const [dirty, setDirty] = useState(false);

  // Replace the live blocks without a history entry; callers checkpoint() first.
  const mutate = useCallback((fn: (bs: Block[]) => Block[]) => {
    setHist((h) => setPresent(h, fn(h.present)));
    setDirty(true);
  }, []);

  const checkpoint = useCallback(() => setHist(hCheckpoint), []);

  const updateBlock = useCallback(
    (id: string, patch: Partial<Block>) =>
      mutate((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    [mutate],
  );

  const addBlock = useCallback(
    (make: () => Omit<Block, "id" | "x" | "y" | "z">) => {
      const id = crypto.randomUUID();
      mutate((bs) => [...bs, { id, x: 120, y: 120, z: frontZ(bs), ...make() }]);
      return id;
    },
    [mutate],
  );

  const addTextBlock = useCallback(
    (type: TextType) =>
      addBlock(() => {
        const d = TEXT_DEFAULTS[type];
        return { type, width: d.width, height: d.height, text: d.text, align: "left" };
      }),
    [addBlock],
  );

  const addImageBlock = useCallback(
    (imageId: string, intrinsicW: number, intrinsicH: number) =>
      addBlock(() => {
        const width = IMAGE_DEFAULT_WIDTH;
        const height =
          intrinsicW > 0 ? Math.round(width * (intrinsicH / intrinsicW)) : width;
        return { type: "image", width, height, imageId };
      }),
    [addBlock],
  );

  const deleteBlock = useCallback(
    (id: string) => mutate((bs) => bs.filter((b) => b.id !== id)),
    [mutate],
  );

  const undo = useCallback(() => {
    setHist(hUndo);
    setDirty(true);
  }, []);
  const redo = useCallback(() => {
    setHist(hRedo);
    setDirty(true);
  }, []);
  const markSaved = useCallback(() => setDirty(false), []);

  return {
    blocks: hist.present,
    dirty,
    canUndo: canUndo(hist),
    canRedo: canRedo(hist),
    updateBlock,
    addTextBlock,
    addImageBlock,
    deleteBlock,
    checkpoint,
    undo,
    redo,
    markSaved,
  };
}

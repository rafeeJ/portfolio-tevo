// The editor's app-owned layout model — the single source of truth for blocks
// while editing. dnd-kit / resize handles / toolbar feed mutations into here;
// the DOM is never authoritative. `dirty` tracks unsaved changes.
import { useCallback, useState } from "react";
import type { Block } from "../lib/types";
import { frontZ } from "./zorder";

export type TextType = "heading" | "subheading" | "body";

const TEXT_DEFAULTS: Record<TextType, { width: number; height: number; text: string }> = {
  heading: { width: 800, height: 96, text: "Heading" },
  subheading: { width: 640, height: 60, text: "Subheading" },
  body: { width: 520, height: 140, text: "Body text" },
};

export interface EditorModel {
  blocks: Block[];
  dirty: boolean;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  addTextBlock: (type: TextType) => string;
  deleteBlock: (id: string) => void;
  markSaved: () => void;
}

export function useEditorModel(initial: Block[]): EditorModel {
  const [blocks, setBlocks] = useState(initial);
  const [dirty, setDirty] = useState(false);

  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setDirty(true);
  }, []);

  const addTextBlock = useCallback((type: TextType) => {
    const id = crypto.randomUUID();
    setBlocks((bs) => {
      const d = TEXT_DEFAULTS[type];
      const block: Block = {
        id,
        type,
        x: 120,
        y: 120,
        width: d.width,
        height: d.height,
        z: frontZ(bs),
        text: d.text,
        align: "left",
      };
      return [...bs, block];
    });
    setDirty(true);
    return id;
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    setDirty(true);
  }, []);

  const markSaved = useCallback(() => setDirty(false), []);

  return { blocks, dirty, updateBlock, addTextBlock, deleteBlock, markSaved };
}

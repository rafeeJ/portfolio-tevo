// The editor's app-owned layout model — the single source of truth for blocks
// while editing. dnd-kit / interact.js feed mutations into here; the DOM is
// never authoritative. `dirty` tracks unsaved changes.
import { useCallback, useState } from "react";
import type { Block } from "../lib/types";

export interface EditorModel {
  blocks: Block[];
  dirty: boolean;
  setPosition: (id: string, x: number, y: number) => void;
  markSaved: () => void;
}

export function useEditorModel(initial: Block[]): EditorModel {
  const [blocks, setBlocks] = useState(initial);
  const [dirty, setDirty] = useState(false);

  const setPosition = useCallback((id: string, x: number, y: number) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, x, y } : b)));
    setDirty(true);
  }, []);

  const markSaved = useCallback(() => setDirty(false), []);

  return { blocks, dirty, setPosition, markSaved };
}

// The editor's app-owned layout model — the single source of truth for blocks
// while editing. dnd-kit / interact.js feed mutations into here (S6+); the DOM
// is never authoritative. S5 is read-only, so it just holds the loaded blocks.
import { useState } from "react";
import type { Block } from "../lib/types";

export interface EditorModel {
  blocks: Block[];
}

export function useEditorModel(initial: Block[]): EditorModel {
  const [blocks] = useState(initial);
  return { blocks };
}

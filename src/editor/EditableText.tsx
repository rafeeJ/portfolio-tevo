// Inline text editing for a text block. Uncontrolled contentEditable: seed the
// text once on mount and read it back on blur, so React never fights the cursor.
import { useEffect, useRef } from "react";
import type { Block } from "../lib/types";
import { textPresetStyle } from "../render/render-blocks";

export function EditableText({
  block,
  onCommit,
}: {
  block: Block;
  onCommit: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = block.text ?? "";
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false); // cursor at end
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // mount-only: seed the text once, then leave the DOM uncontrolled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (block.type === "image") return null;
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-editing="true"
      style={{ ...textPresetStyle(block.type, block.align), outline: "none", cursor: "text" }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => onCommit(e.currentTarget.textContent ?? "")}
      onKeyDown={(e) => {
        if (e.key === "Escape") e.currentTarget.blur();
      }}
    />
  );
}

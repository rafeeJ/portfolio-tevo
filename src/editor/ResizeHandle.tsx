// A corner resize handle. Raw pointer events (with stopPropagation so dnd-kit
// doesn't also drag) feed the pure resizeBlock; geometry captured at gesture
// start so the total delta is measured from there.
import { useRef, type CSSProperties } from "react";
import type { Block } from "../lib/types";
import { resizeBlock, type Box, type Corner } from "./geometry";

export function ResizeHandle({
  corner,
  block,
  scale,
  canvasH,
  onResizeStart,
  onResize,
}: {
  corner: Corner;
  block: Block;
  scale: number;
  canvasH: number;
  onResizeStart: () => void;
  onResize: (box: Box) => void;
}) {
  const start = useRef<{ block: Block; x: number; y: number } | null>(null);
  const lockAspect = block.type === "image";
  return (
    <div
      style={handleStyle(corner)}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onResizeStart(); // one undo checkpoint per resize gesture
        start.current = { block, x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const s = start.current;
        onResize(
          resizeBlock(s.block, corner, e.clientX - s.x, e.clientY - s.y, scale, canvasH, lockAspect),
        );
      }}
      onPointerUp={(e) => {
        start.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    />
  );
}

function handleStyle(corner: Corner): CSSProperties {
  const size = 12;
  const off = -size / 2;
  const east = corner.includes("e");
  const south = corner.includes("s");
  return {
    position: "absolute",
    width: size,
    height: size,
    background: "#3b82f6",
    borderRadius: 2,
    zIndex: 1001,
    touchAction: "none",
    [east ? "right" : "left"]: off,
    [south ? "bottom" : "top"]: off,
    cursor: east === south ? "nwse-resize" : "nesw-resize",
  };
}

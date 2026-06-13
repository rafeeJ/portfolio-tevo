// Interactive editor canvas. Block bodies are dnd-kit draggables; corner handles
// resize via raw pointer events (stopPropagation keeps dnd-kit from also dragging).
// Everything is positioned in canvas coordinates (% of the canvas box); the canvas
// is never CSS-scaled, so dnd-kit's screen-px transform tracks the cursor. Screen
// deltas convert to canvas coords through ./geometry.
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CANVAS_WIDTH, type Block } from "../lib/types";
import { BlockContent, type ResolvedImage } from "../render/render-blocks";
import { toBoxPercent } from "../render/scale";
import {
  applyDrag,
  editorCanvasHeight,
  resizeBlock,
  type Box,
  type Corner,
} from "./geometry";
import { computeAlignment, snapDragResult } from "./snap";

const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

export interface EditorCanvasProps {
  blocks: Block[];
  resolveImage?: (imageId: string) => ResolvedImage;
  onUpdate: (id: string, patch: Partial<Block>) => void;
  snap: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface Guides {
  vLines: number[];
  hLines: number[];
}

const NO_GUIDES: Guides = { vLines: [], hLines: [] };

export function EditorCanvas({
  blocks,
  resolveImage,
  onUpdate,
  snap,
  selectedId,
  onSelect,
}: EditorCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(CANVAS_WIDTH);
  const [guides, setGuides] = useState<Guides>(NO_GUIDES);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const canvasH = editorCanvasHeight(blocks);
  const scale = width / CANVAS_WIDTH;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // The dragged block's provisional box and its siblings, in canvas coords.
  const provisional = (event: DragMoveEvent | DragEndEvent) => {
    const block = blocks.find((b) => b.id === event.active.id);
    if (!block) return null;
    const pos = applyDrag(block, event.delta.x, event.delta.y, scale, canvasH);
    const box: Box = { ...pos, width: block.width, height: block.height };
    const others: Box[] = blocks.filter((b) => b.id !== block.id);
    return { block, box, others };
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!snap) return;
    const p = provisional(event);
    if (!p) return;
    const a = computeAlignment(p.box, p.others);
    setGuides({ vLines: a.vLines, hLines: a.hLines });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setGuides(NO_GUIDES);
    const p = provisional(event);
    if (!p) return;
    onSelect(p.block.id);
    if (snap) {
      const s = snapDragResult(p.box, p.others);
      onUpdate(p.block.id, { x: s.x, y: s.y });
    } else {
      onUpdate(p.block.id, { x: p.box.x, y: p.box.y });
    }
  };

  return (
    <div
      ref={ref}
      className="canvas-stage relative bg-white"
      style={{
        width: "100%",
        aspectRatio: `${CANVAS_WIDTH} / ${canvasH}`,
        containerType: "inline-size",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      <DndContext sensors={sensors} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        {blocks.map((block) => (
          <DraggableBlock
            key={block.id}
            block={block}
            canvasH={canvasH}
            scale={scale}
            resolveImage={resolveImage}
            onUpdate={onUpdate}
            selected={block.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </DndContext>
      <GuideLines guides={guides} canvasH={canvasH} />
    </div>
  );
}

function GuideLines({ guides, canvasH }: { guides: Guides; canvasH: number }) {
  return (
    <>
      {guides.vLines.map((x) => (
        <div
          key={`v${x}`}
          data-guide="v"
          style={{
            position: "absolute",
            left: `${(x / CANVAS_WIDTH) * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: "#ec4899",
            zIndex: 2000,
            pointerEvents: "none",
          }}
        />
      ))}
      {guides.hLines.map((y) => (
        <div
          key={`h${y}`}
          data-guide="h"
          style={{
            position: "absolute",
            top: `${(y / canvasH) * 100}%`,
            left: 0,
            right: 0,
            height: 1,
            background: "#ec4899",
            zIndex: 2000,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

function DraggableBlock({
  block,
  canvasH,
  scale,
  resolveImage,
  onUpdate,
  selected,
  onSelect,
}: {
  block: Block;
  canvasH: number;
  scale: number;
  resolveImage?: (imageId: string) => ResolvedImage;
  onUpdate: (id: string, patch: Partial<Block>) => void;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
  });
  const box = toBoxPercent(block, canvasH);
  const style: CSSProperties = {
    position: "absolute",
    left: `${box.left}%`,
    top: `${box.top}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
    zIndex: isDragging ? 1000 : block.z,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    cursor: "grab",
    touchAction: "none",
    outline:
      selected || isDragging
        ? "2px solid #3b82f6"
        : "1px solid rgba(0,0,0,0.08)",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={block.id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      {...listeners}
      {...attributes}
    >
      <BlockContent block={block} resolveImage={resolveImage} sizes="40vw" />
      {selected &&
        CORNERS.map((corner) => (
          <ResizeHandle
            key={corner}
            corner={corner}
            block={block}
            scale={scale}
            canvasH={canvasH}
            onResize={(b) => onUpdate(block.id, b)}
          />
        ))}
    </div>
  );
}

function ResizeHandle({
  corner,
  block,
  scale,
  canvasH,
  onResize,
}: {
  corner: Corner;
  block: Block;
  scale: number;
  canvasH: number;
  onResize: (box: Box) => void;
}) {
  // Geometry captured at gesture start so the total delta is measured from there.
  const start = useRef<{ block: Block; x: number; y: number } | null>(null);
  const lockAspect = block.type === "image";
  return (
    <div
      style={handleStyle(corner)}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
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
  const base: CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    background: "#3b82f6",
    borderRadius: 2,
    zIndex: 1001,
    touchAction: "none",
  };
  const east = corner.includes("e");
  const south = corner.includes("s");
  return {
    ...base,
    [east ? "right" : "left"]: off,
    [south ? "bottom" : "top"]: off,
    cursor: east === south ? "nwse-resize" : "nesw-resize",
  };
}

// Interactive editor canvas. Blocks are dnd-kit draggables positioned in canvas
// coordinates (% of the canvas box); on drop, the screen-space delta is converted
// to canvas coordinates (geometry.applyDrag) and pushed to the model. The canvas
// itself is never CSS-scaled, so dnd-kit's screen-px transform tracks the cursor.
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CANVAS_WIDTH, type Block } from "../lib/types";
import { BlockContent, type ResolvedImage } from "../render/render-blocks";
import { toBoxPercent } from "../render/scale";
import { applyDrag, editorCanvasHeight } from "./geometry";

export interface EditorCanvasProps {
  blocks: Block[];
  resolveImage?: (imageId: string) => ResolvedImage;
  onMove: (id: string, x: number, y: number) => void;
}

export function EditorCanvas({ blocks, resolveImage, onMove }: EditorCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(CANVAS_WIDTH);
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

  const handleDragEnd = (event: DragEndEvent) => {
    const block = blocks.find((b) => b.id === event.active.id);
    if (!block) return;
    const next = applyDrag(block, event.delta.x, event.delta.y, scale, canvasH);
    onMove(block.id, next.x, next.y);
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
    >
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {blocks.map((block) => (
          <DraggableBlock
            key={block.id}
            block={block}
            canvasH={canvasH}
            resolveImage={resolveImage}
          />
        ))}
      </DndContext>
    </div>
  );
}

function DraggableBlock({
  block,
  canvasH,
  resolveImage,
}: {
  block: Block;
  canvasH: number;
  resolveImage?: (imageId: string) => ResolvedImage;
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
    outline: isDragging ? "2px solid #3b82f6" : "1px solid rgba(0,0,0,0.08)",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={block.id}
      {...listeners}
      {...attributes}
    >
      <BlockContent block={block} resolveImage={resolveImage} sizes="40vw" />
    </div>
  );
}

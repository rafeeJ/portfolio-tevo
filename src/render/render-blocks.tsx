// Shared block renderer — used by BOTH the public SSR page and the editor preview.
// Pure-CSS responsive: the stage uses aspect-ratio + percentage positioning and
// `container-type: inline-size` so text (sized in cqw) and boxes scale together
// with no JS viewport measurement. The pure math lives in ./scale.ts.

import type { CSSProperties } from "react";
import { CANVAS_WIDTH, TEXT_PRESETS, type Block } from "../lib/types";
import { canvasHeight, toBoxPercent } from "./scale";

export interface CanvasStageProps {
  blocks: Block[];
  /** Resolves an image block's id to a src URL (wired to /cdn-cgi/image in S3). */
  resolveImageSrc?: (imageId: string) => string;
}

export function CanvasStage({ blocks, resolveImageSrc }: CanvasStageProps) {
  const h = canvasHeight(blocks);
  const stageStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: h === 0 ? undefined : `${CANVAS_WIDTH} / ${h}`,
    containerType: "inline-size",
  };
  return (
    <div className="canvas-stage" style={stageStyle}>
      {[...blocks]
        .sort((a, b) => a.z - b.z)
        .map((block) => (
          <BlockView
            key={block.id}
            block={block}
            canvasH={h}
            resolveImageSrc={resolveImageSrc}
          />
        ))}
    </div>
  );
}

function BlockView({
  block,
  canvasH,
  resolveImageSrc,
}: {
  block: Block;
  canvasH: number;
  resolveImageSrc?: (imageId: string) => string;
}) {
  const box = toBoxPercent(block, canvasH);
  const base: CSSProperties = {
    position: "absolute",
    left: `${box.left}%`,
    top: `${box.top}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
    zIndex: block.z,
  };

  if (block.type === "image") {
    const src = block.imageId ? resolveImageSrc?.(block.imageId) : undefined;
    return (
      <div style={base}>
        {src ? (
          <img
            src={src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#e5e5e5" }} />
        )}
      </div>
    );
  }

  // block.type is narrowed to a text preset key after the image early-return above.
  const preset = TEXT_PRESETS[block.type];
  const textStyle: CSSProperties = {
    ...base,
    fontSize: `${preset.fontSizeCqw}cqw`,
    fontWeight: preset.fontWeight,
    lineHeight: preset.lineHeight,
    textAlign: block.align ?? "left",
    overflow: "hidden",
  };
  return <div style={textStyle}>{block.text}</div>;
}

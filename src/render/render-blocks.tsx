// Shared block renderer — used by BOTH the public SSR page and the editor preview.
// Pure-CSS responsive: the stage uses aspect-ratio + percentage positioning and
// `container-type: inline-size` so text (sized in cqw) and boxes scale together
// with no JS viewport measurement. The pure math lives in ./scale.ts.

import type { CSSProperties } from "react";
import { imageSrcSet, imageUrl } from "../images/url";
import {
  CANVAS_WIDTH,
  TEXT_PRESETS,
  type Block,
  type TextAlign,
  type TextPresetKey,
} from "../lib/types";
import { canvasHeight, toBoxPercent } from "./scale";

/** The CSS for a text preset, filling its box. Shared by the renderer + editor. */
export function textPresetStyle(
  type: TextPresetKey,
  align: TextAlign = "left",
): CSSProperties {
  const preset = TEXT_PRESETS[type];
  return {
    width: "100%",
    height: "100%",
    fontSize: `${preset.fontSizeCqw}cqw`,
    fontWeight: preset.fontWeight,
    lineHeight: preset.lineHeight,
    textAlign: align,
    overflow: "hidden",
  };
}

export interface ResolvedImage {
  src: string;
  srcSet?: string;
}

/** Default resolver: serve images through the /img resize pipeline. */
export function pipelineImageResolver(imageId: string): ResolvedImage {
  return { src: imageUrl(imageId), srcSet: imageSrcSet(imageId) };
}

export interface CanvasStageProps {
  blocks: Block[];
  /** Resolves an image block's id to a src (+ optional srcset). Wired to the
   *  /img pipeline on the public page; the editor passes its own resolver. */
  resolveImage?: (imageId: string) => ResolvedImage;
}

export function CanvasStage({ blocks, resolveImage }: CanvasStageProps) {
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
            resolveImage={resolveImage}
          />
        ))}
    </div>
  );
}

function BlockView({
  block,
  canvasH,
  resolveImage,
}: {
  block: Block;
  canvasH: number;
  resolveImage?: (imageId: string) => ResolvedImage;
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
  return (
    <div style={base}>
      <BlockContent
        block={block}
        resolveImage={resolveImage}
        sizes={`${Math.round(box.width)}vw`}
      />
    </div>
  );
}

/**
 * Renders a block's content filling its positioned parent (100% box). Shared by
 * the public CanvasStage and the editor canvas, which own the positioning.
 */
export function BlockContent({
  block,
  resolveImage,
  sizes,
}: {
  block: Block;
  resolveImage?: (imageId: string) => ResolvedImage;
  sizes?: string;
}) {
  if (block.type === "image") {
    const img = block.imageId ? resolveImage?.(block.imageId) : undefined;
    return img ? (
      <img
        src={img.src}
        srcSet={img.srcSet}
        sizes={sizes}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    ) : (
      <div style={{ width: "100%", height: "100%", background: "#e5e5e5" }} />
    );
  }

  // block.type is narrowed to a text preset key after the image early-return above.
  return <div style={textPresetStyle(block.type, block.align)}>{block.text}</div>;
}

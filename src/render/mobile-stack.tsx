// Mobile layout: the reflowed single column. Blocks flow top-to-bottom at full
// width; images preserve aspect via CSS, text uses readable (not canvas-scaled)
// sizes. Ordering comes from the pure reflow(); this file owns the layout.
import type { CSSProperties } from "react";
import type { Block, TextAlign } from "../lib/types";
import { reflow } from "../reflow/reflow";
import { PLACEHOLDER, type ResolvedImage } from "./render-blocks";
import { priorityImageId } from "./scale";

const TEXT_CLASS: Record<Exclude<Block["type"], "image">, string> = {
  heading: "text-3xl font-bold leading-tight",
  subheading: "text-xl font-semibold leading-snug",
  body: "text-base leading-relaxed",
};

const ALIGN_CLASS: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function MobileStack({
  blocks,
  resolveImage,
}: {
  blocks: Block[];
  resolveImage?: (imageId: string) => ResolvedImage;
}) {
  const hero = priorityImageId(blocks);
  return (
    <div className="flex flex-col gap-6">
      {reflow(blocks).map((block) =>
        block.type === "image" ? (
          <MobileImage
            key={block.id}
            block={block}
            resolveImage={resolveImage}
            eager={block.id === hero}
          />
        ) : (
          <p
            key={block.id}
            className={`${TEXT_CLASS[block.type]} ${ALIGN_CLASS[block.align ?? "left"]}`}
          >
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}

function MobileImage({
  block,
  resolveImage,
  eager,
}: {
  block: Block;
  resolveImage?: (imageId: string) => ResolvedImage;
  eager?: boolean;
}) {
  const aspect: CSSProperties = { aspectRatio: `${block.width} / ${block.height}` };
  const img = block.imageId ? resolveImage?.(block.imageId) : undefined;
  if (!img) {
    return <div className="w-full" style={{ ...aspect, background: PLACEHOLDER }} />;
  }
  return (
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes="100vw"
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      className="block h-auto w-full"
      style={{ ...aspect, background: PLACEHOLDER }}
    />
  );
}

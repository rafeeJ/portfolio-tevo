// Mobile layout: the reflowed single column. Blocks flow top-to-bottom at full
// width; images preserve aspect via CSS, text uses readable (not canvas-scaled)
// sizes. Ordering comes from the pure reflow(); this file owns the layout.
import type { CSSProperties } from "react";
import type { Block, TextAlign } from "../lib/types";
import { reflow } from "../reflow/reflow";
import type { ResolvedImage } from "./render-blocks";

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
  return (
    <div className="flex flex-col gap-6">
      {reflow(blocks).map((block) =>
        block.type === "image" ? (
          <MobileImage key={block.id} block={block} resolveImage={resolveImage} />
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
}: {
  block: Block;
  resolveImage?: (imageId: string) => ResolvedImage;
}) {
  const aspect: CSSProperties = { aspectRatio: `${block.width} / ${block.height}` };
  const img = block.imageId ? resolveImage?.(block.imageId) : undefined;
  if (!img) {
    return <div className="w-full bg-neutral-200" style={aspect} />;
  }
  return (
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes="100vw"
      alt=""
      className="block h-auto w-full"
      style={aspect}
    />
  );
}

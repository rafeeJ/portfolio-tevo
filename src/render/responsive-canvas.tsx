// Picks the layout by viewport with a pure-CSS breakpoint (no JS): the freeform
// CanvasStage on >= md screens, the reflowed MobileStack below it. Both are
// server-rendered; CSS shows exactly one.
import type { Block } from "../lib/types";
import { MobileStack } from "./mobile-stack";
import { CanvasStage, type ResolvedImage } from "./render-blocks";

export function ResponsiveCanvas({
  blocks,
  resolveImage,
}: {
  blocks: Block[];
  resolveImage?: (imageId: string) => ResolvedImage;
}) {
  return (
    <>
      <div className="hidden md:block">
        <CanvasStage blocks={blocks} resolveImage={resolveImage} />
      </div>
      <div className="md:hidden">
        <MobileStack blocks={blocks} resolveImage={resolveImage} />
      </div>
    </>
  );
}

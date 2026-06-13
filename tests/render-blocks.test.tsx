import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CanvasStage, type ResolvedImage } from "../src/render/render-blocks";
import type { Block } from "../src/lib/types";

function img(partial: Partial<Block>): Block {
  return { id: "i", type: "image", x: 0, y: 0, width: 400, height: 300, z: 0, imageId: "k", ...partial };
}

const resolve = (id: string): ResolvedImage => ({ src: `/img/${id}`, srcSet: `/img/${id} 800w` });

describe("CanvasStage image loading", () => {
  it("loads the topmost image eagerly and the rest lazily", () => {
    const html = renderToStaticMarkup(
      <CanvasStage
        blocks={[img({ id: "low", y: 500 }), img({ id: "hero", y: 0 })]}
        resolveImage={resolve}
      />,
    );
    expect(html.match(/loading="eager"/g)).toHaveLength(1);
    expect(html.match(/loading="lazy"/g)).toHaveLength(1);
    // React 19 serializes the camelCase prop and hoists a matching preload link.
    expect(html).toContain('fetchPriority="high"');
  });

  it("renders a placeholder background and a sizes hint capped at the canvas width", () => {
    const html = renderToStaticMarkup(
      <CanvasStage blocks={[img({ width: 720 })]} resolveImage={resolve} />,
    );
    expect(html).toContain("var(--color-paper-2)");
    expect(html).toContain('sizes="min(50vw, 720px)"');
  });
});

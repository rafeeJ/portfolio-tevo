// Public image serving route. Resizes the private R2 original on the fly via the
// Images binding and re-encodes to a format the client accepts. The full-res
// original is NEVER served here — only bounded, re-encoded variants. If resizing
// fails we fail closed (error), never falling back to the original bytes.
import { createFileRoute } from "@tanstack/react-router";
import { getImageById } from "../db/client";
import { clampWidth, negotiateFormat } from "../images/url";
import { getBucket, getDb, getImages } from "../server/env";

const CACHE = "public, max-age=31536000, immutable";

export const Route = createFileRoute("/img/$imageId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const image = await getImageById(getDb(), params.imageId);
        if (!image) return new Response("Not found", { status: 404 });

        const original = await getBucket().get(image.r2_key);
        if (!original) return new Response("Not found", { status: 404 });

        const url = new URL(request.url);
        const width = clampWidth(Number(url.searchParams.get("w")));
        const format = negotiateFormat(request.headers.get("accept"));

        const result = await getImages()
          .input(original.body)
          .transform({ width })
          .output({ format });
        return new Response(result.image(), {
          headers: { "content-type": result.contentType(), "cache-control": CACHE },
        });
      },
    },
  },
});

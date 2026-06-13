// Admin image upload. Stores the original in R2 (private) and records an images
// row. Dimensions/format are read from the bytes server-side via the Images
// binding, so we never trust client-reported metadata.
import { createServerFn } from "@tanstack/react-start";
import { insertImage } from "../db/client";
import { UploadError, validateUpload } from "../images/validate";
import { getBucket, getDb, getImages } from "./env";

export interface UploadResult {
  id: string;
  width: number;
  height: number;
}

export const uploadImage = createServerFn({ method: "POST" })
  .validator((data: FormData) => {
    const file = data.get("file");
    if (!(file instanceof File)) throw new UploadError("No file provided");
    return file;
  })
  .handler(async ({ data: file }): Promise<UploadResult> => {
    const bytes = await file.arrayBuffer();

    const info = await getImages().info(streamOf(bytes));
    if (!("width" in info)) throw new UploadError("Vector images are not supported");
    validateUpload({
      mime: info.format,
      bytes: info.fileSize,
      width: info.width,
      height: info.height,
    });

    const id = crypto.randomUUID();
    const key = `originals/${id}`;
    await getBucket().put(key, bytes, {
      httpMetadata: { contentType: info.format },
    });
    await insertImage(getDb(), {
      id,
      r2_key: key,
      width: info.width,
      height: info.height,
      bytes: info.fileSize,
      mime: info.format,
      created_at: Date.now(),
    });
    return { id, width: info.width, height: info.height };
  });

function streamOf(bytes: ArrayBuffer): ReadableStream<Uint8Array> {
  return new Response(bytes).body!;
}

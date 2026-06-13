// POST /admin/api/upload — store an uploaded image. Under /admin/* so Cloudflare
// Access gates it. Accepts multipart form-data with a `file` field.
import { createFileRoute } from "@tanstack/react-router";
import { processUpload } from "../../../server/images";
import { jsonPost } from "../../../server/http";

export const Route = createFileRoute("/admin/api/upload")({
  server: {
    handlers: {
      POST: jsonPost(async (request) => {
        const file = (await request.formData()).get("file");
        if (!(file instanceof File)) throw new Error("No file provided");
        return processUpload(file);
      }),
    },
  },
});

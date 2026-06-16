// POST /admin/api/set-published — publish or hide a page. Under /admin/* so
// Cloudflare Access gates it.
import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "../../../server/env";
import { jsonPost } from "../../../server/http";
import { applySetPublished, type SetPublishedInput } from "../../../server/pages";

export const Route = createFileRoute("/admin/api/set-published")({
  server: {
    handlers: {
      POST: jsonPost(async (request) =>
        applySetPublished(getDb(), (await request.json()) as SetPublishedInput),
      ),
    },
  },
});

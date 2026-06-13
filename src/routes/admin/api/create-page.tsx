// POST /admin/api/create-page — create a page/subpage. Under /admin/* so
// Cloudflare Access gates it.
import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "../../../server/env";
import { jsonPost } from "../../../server/http";
import {
  applyCreatePage,
  validateCreateInput,
  type CreatePageInput,
} from "../../../server/pages";

export const Route = createFileRoute("/admin/api/create-page")({
  server: {
    handlers: {
      POST: jsonPost(async (request) =>
        applyCreatePage(getDb(), validateCreateInput((await request.json()) as CreatePageInput)),
      ),
    },
  },
});

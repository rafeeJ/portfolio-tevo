// POST /admin/api/save — persist a page's blocks. Under /admin/* so Cloudflare
// Access gates it (the editor's mutating endpoint must not be publicly callable).
import { createFileRoute } from "@tanstack/react-router";
import { applySavePage, validateSaveInput, type SavePageInput } from "../../../server/blocks";
import { getDb } from "../../../server/env";
import { jsonPost } from "../../../server/http";

export const Route = createFileRoute("/admin/api/save")({
  server: {
    handlers: {
      POST: jsonPost(async (request) =>
        applySavePage(getDb(), validateSaveInput((await request.json()) as SavePageInput)),
      ),
    },
  },
});

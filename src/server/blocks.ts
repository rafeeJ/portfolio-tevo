// Persist a page's full block set from the editor. Admin-only (Cloudflare Access
// in prod). Validated before it touches D1; the whole save runs as one batch so
// the page's blocks are reconciled atomically — upsert what's present, delete
// what's gone.
import { createServerFn } from "@tanstack/react-start";
import type { BlockRecord } from "../lib/map";
import type { BlockType } from "../lib/types";
import { getDb } from "./env";

export interface SavePageInput {
  pageId: string;
  blocks: BlockRecord[];
}

const BLOCK_TYPES: ReadonlySet<BlockType> = new Set([
  "image",
  "heading",
  "subheading",
  "body",
]);

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

function validate(data: SavePageInput): SavePageInput {
  if (typeof data?.pageId !== "string" || !Array.isArray(data.blocks)) {
    throw new Error("Invalid save payload");
  }
  for (const b of data.blocks) {
    if (
      typeof b.id !== "string" ||
      !BLOCK_TYPES.has(b.type) ||
      ![b.x, b.y, b.width, b.height, b.z].every(finite)
    ) {
      throw new Error(`Invalid block: ${b?.id}`);
    }
  }
  return data;
}

const UPSERT = `INSERT INTO blocks
  (id, page_id, type, x, y, width, height, z, image_id, text, style, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    type = excluded.type, x = excluded.x, y = excluded.y,
    width = excluded.width, height = excluded.height, z = excluded.z,
    image_id = excluded.image_id, text = excluded.text, style = excluded.style,
    updated_at = excluded.updated_at`;

export const savePage = createServerFn({ method: "POST" })
  .validator(validate)
  .handler(async ({ data }): Promise<{ saved: number }> => {
    const db = getDb();
    const now = Date.now();
    const ids = data.blocks.map((b) => b.id);

    const deleteRemoved =
      ids.length > 0
        ? db
            .prepare(
              `DELETE FROM blocks WHERE page_id = ? AND id NOT IN (${ids.map(() => "?").join(",")})`,
            )
            .bind(data.pageId, ...ids)
        : db.prepare("DELETE FROM blocks WHERE page_id = ?").bind(data.pageId);

    const upserts = data.blocks.map((b) =>
      db
        .prepare(UPSERT)
        .bind(
          b.id,
          data.pageId,
          b.type,
          b.x,
          b.y,
          b.width,
          b.height,
          b.z,
          b.image_id,
          b.text,
          b.style,
          now,
          now,
        ),
    );

    await db.batch([deleteRemoved, ...upserts]);
    return { saved: data.blocks.length };
  });

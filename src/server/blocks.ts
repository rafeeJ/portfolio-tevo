// Persist block layout from the editor. Admin-only (Cloudflare Access in prod).
// Geometry is validated before it touches D1; the writes go through one batch so
// a page's layout is saved atomically.
import { createServerFn } from "@tanstack/react-start";
import { getDb } from "./env";

export interface BlockLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
}

export interface SaveLayoutInput {
  pageId: string;
  blocks: BlockLayout[];
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function validateLayout(data: SaveLayoutInput): SaveLayoutInput {
  if (typeof data?.pageId !== "string" || !Array.isArray(data.blocks)) {
    throw new Error("Invalid layout payload");
  }
  for (const b of data.blocks) {
    if (
      typeof b.id !== "string" ||
      !isFiniteNumber(b.x) ||
      !isFiniteNumber(b.y) ||
      !isFiniteNumber(b.width) ||
      !isFiniteNumber(b.height) ||
      !isFiniteNumber(b.z)
    ) {
      throw new Error(`Invalid block geometry: ${b?.id}`);
    }
  }
  return data;
}

export const saveBlockLayout = createServerFn({ method: "POST" })
  .validator(validateLayout)
  .handler(async ({ data }): Promise<{ saved: number }> => {
    if (data.blocks.length === 0) return { saved: 0 };
    const db = getDb();
    const now = Date.now();
    await db.batch(
      data.blocks.map((b) =>
        db
          .prepare(
            "UPDATE blocks SET x = ?, y = ?, width = ?, height = ?, z = ?, updated_at = ? WHERE id = ? AND page_id = ?",
          )
          .bind(b.x, b.y, b.width, b.height, b.z, now, b.id, data.pageId),
      ),
    );
    return { saved: data.blocks.length };
  });

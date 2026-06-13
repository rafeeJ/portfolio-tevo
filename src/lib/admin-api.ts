// Client-side calls to the Access-gated /admin/api/* mutation routes. These run
// from the admin UI (which is itself behind Cloudflare Access).
import type { BlockRecord } from "./map";

export interface SavePageInput {
  pageId: string;
  blocks: BlockRecord[];
}
export interface UploadResult {
  id: string;
  width: number;
  height: number;
}
export interface CreatePageInput {
  title: string;
  slug: string;
  parentId: string | null;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const postJson = (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

export function savePage(input: SavePageInput): Promise<{ saved: number }> {
  return postJson("/admin/api/save", input).then((r) => unwrap<{ saved: number }>(r));
}

export function createPage(input: CreatePageInput): Promise<{ id: string }> {
  return postJson("/admin/api/create-page", input).then((r) => unwrap<{ id: string }>(r));
}

export function uploadImage(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  return fetch("/admin/api/upload", { method: "POST", body: form }).then((r) =>
    unwrap<UploadResult>(r),
  );
}

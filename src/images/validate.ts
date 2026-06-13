// Pure validation for uploaded images. Throws UploadError on rejection so the
// upload server fn can surface a clean message. No IO here — unit-tested.

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/** 50 MB ceiling on the original upload. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
/** Reject absurd dimensions (defends the resize pipeline). */
export const MAX_DIMENSION = 12000;

export class UploadError extends Error {}

export interface UploadMeta {
  mime: string;
  bytes: number;
  width: number;
  height: number;
}

export function validateUpload(meta: UploadMeta): void {
  if (!ALLOWED_MIME.has(meta.mime)) {
    throw new UploadError(`Unsupported image type: ${meta.mime}`);
  }
  if (meta.bytes <= 0 || meta.bytes > MAX_UPLOAD_BYTES) {
    throw new UploadError(`Image too large (${meta.bytes} bytes)`);
  }
  if (
    meta.width <= 0 ||
    meta.height <= 0 ||
    meta.width > MAX_DIMENSION ||
    meta.height > MAX_DIMENSION
  ) {
    throw new UploadError(`Invalid dimensions: ${meta.width}x${meta.height}`);
  }
}

// Pure builders for public image URLs. Images are served by the /img/$imageId
// server route, which resizes from the private R2 original (see routes/img.$imageId).
// Callers reference images by opaque id — the R2 key is never exposed.

export const DEFAULT_IMG_WIDTH = 1600;
export const VARIANT_WIDTHS = [480, 800, 1200, 1600, 2400] as const;
export const MAX_IMG_WIDTH = 2400;

export function imageUrl(imageId: string, width: number = DEFAULT_IMG_WIDTH): string {
  return `/img/${encodeURIComponent(imageId)}?w=${width}`;
}

/** `srcset` across the standard variant widths for responsive `<img>`. */
export function imageSrcSet(
  imageId: string,
  widths: readonly number[] = VARIANT_WIDTHS,
): string {
  return widths.map((w) => `${imageUrl(imageId, w)} ${w}w`).join(", ");
}

/** Clamp a requested width to a sane range; fall back to the default if invalid. */
export function clampWidth(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_IMG_WIDTH;
  return Math.min(Math.round(raw), MAX_IMG_WIDTH);
}

export type OutputFormat = "image/avif" | "image/webp" | "image/jpeg";

/** Pick the best output format the client accepts (AVIF > WebP > JPEG). */
export function negotiateFormat(accept: string | null): OutputFormat {
  const a = accept ?? "";
  if (a.includes("image/avif")) return "image/avif";
  if (a.includes("image/webp")) return "image/webp";
  return "image/jpeg";
}

// Pure slug helpers. Slugs are the public URL segment (/p/<slug>) and must be
// unique site-wide — uniqueness is enforced at the DB layer; format here.

/** Derive a URL slug from free text: lowercase, alphanumeric runs joined by "-". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Valid slug = lowercase alphanumeric words separated by single hyphens. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

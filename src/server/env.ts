// Server-only access to Cloudflare bindings. Importing `cloudflare:workers`
// keeps this out of the client bundle — only use from server functions/loaders.
import { env } from "cloudflare:workers";

export function getDb(): D1Database {
  return env.DB;
}

export function getBucket(): R2Bucket {
  return env.BUCKET;
}

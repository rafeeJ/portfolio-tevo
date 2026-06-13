-- 0001_init.sql — initial schema for Tevo photo portfolio
-- See docs/SPEC.md "Data Model (D1)". IDs are app-generated (nanoid); timestamps are epoch ms.

-- pages: tree via parent_id; ordered within a parent by sort_order
CREATE TABLE pages (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT REFERENCES pages(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX idx_pages_parent_order ON pages(parent_id, sort_order);

-- images: original lives in R2 (admin-only); intrinsic dims for aspect-correct rendering
CREATE TABLE images (
  id          TEXT PRIMARY KEY,
  r2_key      TEXT NOT NULL,
  width       INTEGER NOT NULL,
  height      INTEGER NOT NULL,
  bytes       INTEGER NOT NULL,
  mime        TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

-- blocks: a page's freeform layout on the fixed-width (1440px) desktop canvas
CREATE TABLE blocks (
  id         TEXT PRIMARY KEY,
  page_id    TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('image', 'heading', 'subheading', 'body')),
  x          REAL NOT NULL,
  y          REAL NOT NULL,
  width      REAL NOT NULL,
  height     REAL NOT NULL,
  z          INTEGER NOT NULL DEFAULT 0,
  image_id   TEXT REFERENCES images(id),
  text       TEXT,
  style      TEXT, -- JSON: { align?: 'left'|'center'|'right' } for text presets
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_blocks_page ON blocks(page_id);
CREATE INDEX idx_blocks_image ON blocks(image_id);

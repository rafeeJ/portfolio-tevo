-- Demo content for local dev / S1.2 verification. Idempotent: clears the demo
-- page first. Image blocks use NULL image_id (real uploads land in S3) so the
-- renderer shows neutral placeholders. Timestamps are 0 (epoch) for determinism.
DELETE FROM blocks WHERE page_id IN ('demo', 'winter', 'about');
DELETE FROM pages WHERE id IN ('winter', 'about', 'demo');

-- Two top-level pages; 'winter' is a subpage of 'demo' to exercise the index tree.
INSERT INTO pages (id, parent_id, slug, title, sort_order, published, created_at, updated_at) VALUES
  ('demo',   NULL,   'demo',   'Demo Page',   0, 1, 0, 0),
  ('winter', 'demo', 'winter', 'Winter Series', 0, 1, 0, 0),
  ('about',  NULL,   'about-me', 'About',       1, 1, 0, 0);

INSERT INTO blocks (id, page_id, type, x, y, width, height, z, image_id, text, style, created_at, updated_at) VALUES
  ('d-h',  'demo', 'heading',    120, 80,  1000, 120, 2, NULL, 'A Quiet Morning',  '{"align":"left"}', 0, 0),
  ('d-s',  'demo', 'subheading', 120, 220, 800,  70,  2, NULL, 'Photographs, 2024', '{"align":"left"}', 0, 0),
  ('d-b',  'demo', 'body',       120, 320, 520,  280, 2, NULL, 'A short series made over a single week, early light through the kitchen window.', '{"align":"left"}', 0, 0),
  ('d-i1', 'demo', 'image',      720, 320, 600,  400, 1, NULL, NULL, NULL, 0, 0),
  ('d-i2', 'demo', 'image',      120, 680, 1200, 500, 1, NULL, NULL, NULL, 0, 0);

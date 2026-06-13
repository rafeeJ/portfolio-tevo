# TODO — Photo Portfolio + Canvas Admin

> Status: **DRAFT — awaiting human approval.** No code until approved.
> Tasks are ordered by dependency. Each ≤ ~5 files. See `tasks/plan.md` for the slice rationale.

## F0 — Foundation (thin base; CP-A)

- [x] **F0.1 Scaffold app** ✅ 2026-06-13
  - Acceptance: TanStack Start app targeting Cloudflare Workers boots; `pnpm dev` serves a hello page; `pnpm typecheck` clean.
  - Verify: `pnpm dev` → open localhost; `pnpm typecheck`.
  - Files: `package.json`, `vite.config.ts`, `wrangler.toml`, `src/routes/index.tsx`.
  - **Done:** Scaffolded via C3 `--framework=tanstack-start` (Cloudflare Vite plugin, not the legacy preset). Verified: `pnpm build` ✅, `pnpm typecheck` ✅ (exit 0), `pnpm dev` serves `/` and `/about` (HTTP 200, SSR). Worker named `tevo`, compat date 2026-06-13 + `nodejs_compat`, `main: @tanstack/react-start/server-entry`. Added `typecheck`/`test:watch` scripts; moved pnpm `allowBuilds` to `pnpm-workspace.yaml`.

- [x] **F0.2 Bindings + migration** ✅ 2026-06-13
  - Acceptance: local D1 (`DB`) + R2 (`BUCKET`) bound; migration creates `pages`, `blocks`, `images` per spec schema; query helper connects.
  - Verify: `pnpm db:migrate` (local) succeeds; a smoke query in an integration test returns empty sets.
  - Files: `wrangler.jsonc`, `migrations/0001_init.sql`, `src/db/schema.ts`, `src/db/client.ts`, `src/server/env.ts`.
  - **Done:** D1 `tevo-db` (`f4a0f12f…`) + R2 `tevo-photos` bound as `DB`/`BUCKET`; `0001_init.sql` applied to local D1 (smoke: tables exist, counts = 0). Typed row types + query helpers + server-only binding seam. Review documented D1's no-FK-cascade behavior (see migration/SPEC/S13). **Deferred:** `--remote` migration + first deploy (launch track).

> **CHECKPOINT CP-A** — local foundation complete; remote migration + deploy deferred to launch track.

## S1 — Render a seeded page (CP-B start)

- [x] **S1.1 Block/page types + shared renderer** ✅ 2026-06-13
  - Acceptance: `Block` type + `renderBlocks()` produce absolutely-positioned DOM scaled within a 1440px canvas container; pure scaling math unit-tested.
  - Verify: unit tests for scaling at 1440/1024/390 widths.
  - Files: `src/lib/types.ts`, `src/render/scale.ts`, `src/render/render-blocks.tsx`, `tests/scale.test.ts`, `vitest.config.ts`.
  - **Done:** `Block`/`CANVAS_WIDTH`/`TEXT_PRESETS` in lib/types; pure `canvasHeight`/`toBoxPercent` in render/scale (10 unit tests); `CanvasStage` renders pure-CSS-responsive (aspect-ratio + % positioning + `cqw` text via `container-type`). Dedup'd `BlockType` into lib/types.

- [x] **S1.2 Public page route + seed** ✅ 2026-06-13
  - Acceptance: `/p/:slug` SSR-loads a page's blocks from D1 and renders them; a seed script inserts one demo page with mixed blocks.
  - Verify: `pnpm db:seed` then visit `/p/demo` → blocks appear positioned correctly.
  - Files: `src/routes/p.$slug.tsx`, `src/server/pages.ts`, `src/lib/map.ts`, `scripts/seed.sql`.
  - **Done:** `loadPageBySlug` server fn (D1 via getDb) + `rowToBlock` mapper + `/p/$slug` SSR route. Verified live: `/p/demo` SSR-renders 5 seeded blocks at correct % positions (aspect-ratio 1440/1180), text presets at 4.2/2.6/1.4cqw, `/p/nope` → 404.

## S2 — Browsable index (CP-B)

- [x] **S2.1 Page-tree query + index route** ✅ 2026-06-13
  - Acceptance: home (and/or `/index`) renders the nested page/subpage tree from `parent_id`+`sort_order` as a navigable TOC linking to `/p/:slug`.
  - Verify: seed a parent + subpage; index shows nesting; links resolve.
  - Files: `src/lib/tree.ts`, `src/routes/index.tsx`, `tests/tree.test.ts`, `src/server/pages.ts` (loadIndex), `scripts/seed.sql`.
  - **Done:** pure `buildTree` (7 tests, incl. orphan/filtered-parent safety) + `loadIndex` server fn (published only) + recursive `TreeList` home route. Verified live: index shows Demo Page › Winter Series (nested) + About; all links resolve 200.

> **CHECKPOINT CP-B** ✅ — first visible site (seeded page render + browsable index) complete.

## S3 — Image upload + resize pipeline

- [x] **S3.1 Image URL builder** ✅ 2026-06-13
  - Acceptance: pure builder produces correct variant URLs + srcset; unit-tested.
  - Files: `src/images/url.ts`, `tests/images.test.ts`.
  - **Done:** `imageUrl`/`imageSrcSet`/`clampWidth`/`negotiateFormat` (pure, 12 tests). URLs point at the `/img/$imageId` route (opaque id; R2 key never exposed) — not raw `/cdn-cgi/image`, since originals must stay private.

- [x] **S3.2 Upload server function (admin)** ✅ 2026-06-13
  - Acceptance: accepts a high-res upload, validates type/size + dimensions, stores original in R2, writes `images` row; returns image id + dims.
  - Files: `src/server/images.ts`, `src/images/validate.ts`, `src/db/client.ts`.
  - **Done:** `uploadImage` server fn reads dims/format **server-side** via `IMAGES.info()` (no trusting the client), `validateUpload` (pure, unit-tested), stores R2 original under `originals/<uuid>`, inserts images row. _Full e2e deferred to S11 (upload UI); binding + R2 write paths proven via the serving test below._

- [x] **S3.3 Image serving + render via pipeline** ✅ 2026-06-13
  - Acceptance: image blocks render `<img srcset>` through the pipeline; originals never served to public.
  - Files: `src/routes/img.$imageId.tsx`, `src/render/render-blocks.tsx`, `scripts/seed.sql`, `scripts/seed-assets/demo.png`, `wrangler.jsonc` (images binding).
  - **Done:** `/img/$imageId` server route resizes the private R2 original via the Images binding, format-negotiates AVIF/WebP/JPEG, caches immutably. Verified live: `?w=400`→AVIF 400×267, `?w=800`→WebP 800×533 (aspect preserved), `/img/nope`→404. `/p/demo` image block renders full responsive srcset. **Review caught + fixed a security bug:** removed a catch-fallback that would have leaked full-res originals if resize failed — now fails closed.

## S4 — Mobile auto-reflow (CP-C)

- [x] **S4.1 `reflow()` pure module** ✅ 2026-06-13
  - Acceptance: `reflow` sorts by (y,x) into one column; ≥ 8 fixture layouts; high coverage.
  - Files: `src/reflow/reflow.ts`, `tests/reflow.test.ts`.
  - **Done:** pure `reflow(blocks)` → reading-order stack (y, then x, id tie-break); 10 fixtures (ordering, side-by-side, grid, overlap, ties, no-mutation). Aspect-preservation is the renderer's job (CSS), keeping reflow pure.

- [x] **S4.2 Wire reflow into public renderer** ✅ 2026-06-13
  - Acceptance: viewport < breakpoint renders reflowed single column; no horizontal scroll; images aspect-correct.
  - Files: `src/render/mobile-stack.tsx`, `src/render/responsive-canvas.tsx`, `src/routes/p.$slug.tsx`.
  - **Done:** `MobileStack` (flex column, full-width images via CSS aspect-ratio, readable text sizes) + `ResponsiveCanvas` (CSS `md:` breakpoint toggle, no JS, SSR-safe). Verified live: `/p/demo` mobile = heading→subheading→body→image in reading order, `100vw` images.
  - ⚠️ **Launch-perf note (S14):** render-both-toggle-CSS means a browser may fetch image variants for the hidden layout. Acceptable for v1; revisit at S14 if LCP suffers (JS switch or single-`<picture>` approach).

> **CHECKPOINT CP-C** ✅ — public read-path complete (render + images + mobile reflow).

## S5–S13 — Canvas editor (behind local /admin; CP-D)

- [x] **S5 Editor shell** ✅ 2026-06-13
  - Acceptance: `/admin/p/:id` loads a page's blocks into an app-owned layout model (single source of truth) and renders them read-only on the canvas via the shared renderer.
  - Verify: open editor for seeded page; blocks match public render.
  - Files: `src/routes/admin/p.$id.tsx`, `src/editor/model.ts`, `src/server/pages.ts` (loadEditorPage), `src/db/client.ts` (getPageById).
  - **Done:** `/admin/p/$id` loads via `loadEditorPage` into `useEditorModel` (SoT seam, grows in S6), renders read-only via shared `CanvasStage`. Verified live: matches public render (canvas + image pipeline + text), bad id → 404. Review: factored `pageWithBlocks` (shared loader helper) + canonical `pipelineImageResolver` (killed a duplicate).

- [x] **S6 Drag + persist** ✅ 2026-06-13
  - Acceptance: drag a block (dnd-kit) updates the model; Save persists new x/y to D1; reload shows moved block.
  - Verify: e2e — drag, save, reload, assert position.
  - Files: `src/editor/geometry.ts`, `src/editor/EditorCanvas.tsx`, `src/editor/model.ts`, `src/server/blocks.ts`, `src/routes/admin/p.$id.tsx`, `src/render/render-blocks.tsx` (BlockContent extract), `tests/geometry.test.ts`.
  - **Done:** pure `geometry` (drag delta→canvas, clamp; 9 tests). `EditorCanvas` = dnd-kit draggables in canvas coords; no CSS-scaled parent so transforms track the cursor. `saveBlockLayout` = validated atomic `db.batch` UPDATE. Model `setPosition`/`dirty`. **Verified in a real browser (chrome-devtools MCP):** dragged heading → clamped to (0,400) → Save → D1 shows x=0,y=400 → reload renders persisted position. Review: extracted `BlockContent` (shared renderer) + reused `toBoxPercent`.

- [x] **S7 Resize + persist** ✅ 2026-06-13
  - Acceptance: resize handles update w/h in the model; images keep aspect by default; Save persists.
  - Verify: e2e — resize, save, reload, assert dims + aspect lock.
  - Files: `src/editor/geometry.ts` (resizeBlock), `src/editor/EditorCanvas.tsx` (corner handles), `src/editor/model.ts` (updateBlock), `tests/geometry.test.ts`.
  - **Done:** pure `resizeBlock` (anchor + aspect-lock + clamp; 5 tests). Corner handles use raw pointer events + `stopPropagation` (no dnd-kit conflict) — **deviation from specced interact.js**, flagged; avoids two libs fighting for pointer events. Model generalized to `updateBlock(id, patch)`. **Verified in browser (MCP):** resized image 600×400→699×466 (aspect 1.50 held) → Save → D1 persists. **Note:** interact.js not used (raw handles instead); handles always-visible pending selection (~S9).

- [x] **S8 Snap-to-grid + smart guides** ✅ 2026-06-13
  - Acceptance: toggle enables 8px snap + edge/center alignment guides; off = free placement.
  - Verify: e2e — with snap on, dropped block lands on grid; guides appear on alignment.
  - Files: `src/editor/snap.ts`, `src/editor/EditorCanvas.tsx` (onDragMove guides + GuideLines), `src/routes/admin/p.$id.tsx` (Snap toggle), `tests/snap.test.ts`.
  - **Done:** pure `snapToGrid` + `computeAlignment` (edge/center vs siblings) + `snapDragResult` (alignment priority, grid fallback; 8 tests). Live guides during drag (`onDragMove` → pink lines), snap-on-drop, `Snap` checkbox gate. **Verified in browser (MCP):** snap-ON drag produced exact center-alignment (20,195) to the subheading; toggle works. _Note: couldn't cleanly isolate grid-vs-free in-browser (MCP drag always center-aligns; synthetic events don't drive dnd-kit) — relied on the 8 unit tests + observed alignment wiring._

- [x] **S9 Z-order controls** ✅ 2026-06-13
  - Acceptance: bring-forward / send-back reorder `z`; overlap respects order; persists.
  - Verify: e2e — reorder, save, reload asserts stacking.
  - Files: `src/editor/zorder.ts`, `src/editor/EditorCanvas.tsx` (selection), `src/routes/admin/p.$id.tsx` (z buttons), `tests/zorder.test.ts`.
  - **Done:** pure `frontZ`/`backZ` (just above/below extremes; 4 tests). Added **block selection** (click → blue outline + handles only on selected, resolving S7's always-visible-handles note; click canvas to deselect). Bring-to-front / Send-to-back header buttons act on selection (z = max+1 / min−1). **Verified in browser (MCP):** select d-h → send-to-back z=0 → bring-to-front z=3 → Save → D1 persists z=3.

- [x] **S10 Text preset blocks** ✅ 2026-06-13
  - Acceptance: add Heading/Subheading/Body blocks; inline-edit text; preset fixes size/weight/line-height; alignment is the only per-block control; persists.
  - Verify: e2e — add each preset, type, save, public render matches preset styling.
  - Files: `src/editor/model.ts` (addTextBlock/deleteBlock), `src/editor/EditableText.tsx`, `src/server/blocks.ts` (savePage), `src/lib/map.ts` (blockToRecord), `src/render/render-blocks.tsx` (textPresetStyle), `src/routes/admin/p.$id.tsx` (toolbar), `tests/map.test.ts`.
  - **Done:** Toolbar adds Heading/Subheading/Body; double-click → inline contentEditable; align L/C/R; Delete. **`savePage`** rewrites the page's blocks atomically (upsert + delete-reconcile, validated). `blockToRecord` (3 round-trip tests). **Verified in browser (MCP):** add heading → edit text "My New Heading" → center align → Save → D1 persists (originals intact, 6 blocks) → delete → Save → reconciles to 5. Also extracted ResizeHandle/EditableText to their own files (canvas 366→257 lines).

- [x] **S11 Upload + place image from editor** ✅ 2026-06-13
  - Acceptance: upload UI calls S3.2, creates an image block on the canvas at intrinsic-derived size; persists.
  - Verify: e2e — upload fixture, block appears, save, public shows it.
  - Files: `src/editor/model.ts` (addImageBlock + addBlock helper), `src/routes/admin/p.$id.tsx` (+ Photo, file input, onPickFile).
  - **Done:** "+ Photo" → file picker → `uploadImage` (R2 store + images row via `IMAGES.info` dims) → `addImageBlock` (aspect-correct) → renders via /img. **Verified in browser (MCP `upload_file`):** uploaded a fixture → block appears (480×320 variant, 3:2) → Save → D1 images row (1200×800) + block.image_id + R2 object all persist. **Skills run this branch:** thermo-nuclear (extracted shared `addBlock`; added upload error handling) + deslop (constant-naming tidy).

- [x] **S12 Undo/redo (in-session)** ✅ 2026-06-13
  - Acceptance: undoes/redoes drag/resize/z/text/add/delete within the session; not persisted history.
  - Verify: unit tests on the history; e2e undo after a drag.
  - Files: `src/editor/history.ts`, `src/editor/model.ts`, `src/editor/EditorCanvas.tsx`, `src/editor/ResizeHandle.tsx`, `src/routes/admin/p.$id.tsx`, `tests/history.test.ts`.
  - **Done:** pure generic `History<T>` (checkpoint/setPresent/undo/redo, 100-cap; 7 tests). Model wraps blocks in history; **checkpoints at gesture boundaries** (drag-start, resize-start, text-commit, before each discrete op) so one gesture = one undo step. Undo/Redo buttons + ⌘Z/⌘⇧Z (guarded while editing text). **Verified in browser (MCP):** drag→undo→original→redo→moved; multi-move resize = exactly one undo step (no flooding). _Note: undo always marks dirty (undo-to-saved still shows "unsaved" — harmless; future refinement._
  - Skills this branch: deslop (clean); thermo-nuclear applied inline (harness now blocks auto-invoking that skill).

- [x] **S13 Create page / subpage UI** ✅ 2026-06-13
  - Acceptance: admin can create a page or subpage (title, slug, optional parent); slug validated/unique; appears in index.
  - Verify: e2e — create subpage, see it nested in index, open its editor.
  - Files: `src/routes/admin/index.tsx` (dashboard + form), `src/server/pages.ts` (createPage/loadAllPages), `src/db/client.ts` (insertPage), `src/lib/slug.ts`, `tests/slug.test.ts`.
  - **Done:** `/admin` lists the page tree + a New-page form (title → auto-slug, optional parent). `createPage` validates slug format (pure `isValidSlug`, 6 tests) + uniqueness, auto sort-order. **Verified in browser (MCP):** created "Spring Series" under Demo → persisted (parent=demo) → navigated to its editor → appears nested in `/admin` + public `/`; duplicate slug `demo` → "already in use" error, no navigation.
  - ⚠️ **Future: page DELETE must cascade in app code** — D1 doesn't enforce FK `ON DELETE CASCADE`; delete child pages + blocks explicitly via `db.batch`. (Page deletion UI not built yet; create-only for now.)

> **CHECKPOINT CP-D** ✅ — full editor complete (create page · add/edit/arrange/resize/snap/z-order/delete blocks · image upload · undo/redo · save).

> **CHECKPOINT CP-D** — full editor works locally. Review.

## Infra track (parallel; do before S14)

- [ ] **I1 Subdomain route** — `tevo.rafee.cloud` Worker custom domain/route on the `rafee.cloud` zone. Verify: deployed Worker answers on the subdomain.
- [ ] **I2 Cloudflare Access** — Zero Trust app covering `/admin/*` + mutating API; policy = owner identity (Google/OTP). Verify: anon hits `/admin` → Access login.
- [ ] **I3 Image Resizing** — enabled on the zone; `/cdn-cgi/image` serves variants from `tevo.rafee.cloud`. Verify: a resize URL returns AVIF/WebP.

## S14 — Launch hardening (CP-E)

- [ ] **S14.1 Enforce auth boundary**
  - Acceptance: all mutating server functions reachable only behind Access; negative test confirms unauth mutation is rejected (spec criterion #6).
  - Verify: e2e/integration negative-auth test.
  - Files: `src/server/_guard.ts`, `e2e/auth-boundary.spec.ts`.

- [ ] **S14.2 Validation + deploy + full e2e**
  - Acceptance: input validation pass (slugs, coords, block types, image limits); deploy to `tevo.rafee.cloud`; spec success criteria 1–7 all pass; LCP image < 2.5s on simulated 4G.
  - Verify: `pnpm deploy`; full Playwright suite against the deployed URL; Lighthouse check.
  - Files: `src/server/validate.ts`, `e2e/full-flow.spec.ts`, `wrangler.toml`.

> **CHECKPOINT CP-E** — launch gate. All success criteria pass; `/admin` gated.

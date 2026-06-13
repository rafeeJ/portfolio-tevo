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

- [ ] **S2.1 Page-tree query + index route**
  - Acceptance: home (and/or `/index`) renders the nested page/subpage tree from `parent_id`+`sort_order` as a navigable TOC linking to `/p/:slug`.
  - Verify: seed a parent + subpage; index shows nesting; links resolve.
  - Files: `src/server/tree.ts`, `src/routes/index.tsx`, `tests/tree.test.ts`.

> **CHECKPOINT CP-B** — first visible site (seeded page + index). Review.

## S3 — Image upload + resize pipeline

- [ ] **S3.1 `/cdn-cgi/image` URL builder**
  - Acceptance: pure builder produces correct resize URLs (width, `f=auto`, quality) from an R2 object path; unit-tested for variants + srcset.
  - Verify: unit tests assert exact URLs.
  - Files: `src/images/url.ts`, `tests/image-url.test.ts`.

- [ ] **S3.2 Upload server function (admin)**
  - Acceptance: accepts a high-res upload, validates type/size + client-sent intrinsic dimensions, stores original in R2, writes `images` row; returns image id + dims.
  - Verify: integration test uploads a fixture to local R2, asserts row + key.
  - Files: `src/server/images.ts`, `src/images/validate.ts`, `tests/upload.test.ts`.

- [ ] **S3.3 Image block renders via pipeline**
  - Acceptance: `type='image'` blocks render `<img srcset>` through the URL builder at display size; originals never served to public.
  - Verify: seed an image block; public page shows a resized variant URL (not the R2 original).
  - Files: `src/render/render-blocks.tsx`, `e2e/public-image.spec.ts`.

## S4 — Mobile auto-reflow (CP-C)

- [ ] **S4.1 `reflow()` pure module**
  - Acceptance: `reflow(blocks, mobileWidth)` sorts by (y,x), stacks to one column, preserves aspect ratios; ≥ 8 fixture layouts → expected outputs; ≥ 90% coverage on the module.
  - Verify: `pnpm test src/reflow`.
  - Files: `src/reflow/reflow.ts`, `tests/reflow.test.ts`.

- [ ] **S4.2 Wire reflow into public renderer**
  - Acceptance: viewport < breakpoint renders reflowed single column; no horizontal scroll at 390px; images aspect-correct.
  - Verify: Playwright at 390px viewport on the seeded page.
  - Files: `src/render/render-blocks.tsx`, `e2e/mobile-reflow.spec.ts`.

> **CHECKPOINT CP-C** — public read-path complete (images + mobile). Review.

## S5–S13 — Canvas editor (behind local /admin; CP-D)

- [ ] **S5 Editor shell**
  - Acceptance: `/admin/p/:id` loads a page's blocks into an app-owned layout model (single source of truth) and renders them read-only on the canvas via the shared renderer.
  - Verify: open editor for seeded page; blocks match public render.
  - Files: `src/routes/admin/p.$id.tsx`, `src/editor/model.ts`, `src/editor/Canvas.tsx`.

- [ ] **S6 Drag + persist**
  - Acceptance: drag a block (dnd-kit) updates the model; Save persists new x/y to D1; reload shows moved block.
  - Verify: e2e — drag, save, reload, assert position.
  - Files: `src/editor/Canvas.tsx`, `src/editor/useDrag.ts`, `src/server/blocks.ts`, `e2e/editor-drag.spec.ts`.

- [ ] **S7 Resize + persist**
  - Acceptance: resize handles (interact.js) update w/h in the model; images keep aspect by default (unlockable); Save persists.
  - Verify: e2e — resize, save, reload, assert dims + aspect lock.
  - Files: `src/editor/useResize.ts`, `src/editor/Canvas.tsx`, `e2e/editor-resize.spec.ts`.

- [ ] **S8 Snap-to-grid + smart guides**
  - Acceptance: toggle enables 8px snap + edge/center alignment guides; off = free placement.
  - Verify: e2e — with snap on, dropped block lands on grid; guides appear on alignment.
  - Files: `src/editor/snap.ts`, `src/editor/Guides.tsx`, `tests/snap.test.ts`.

- [ ] **S9 Z-order controls**
  - Acceptance: bring-forward / send-back reorder `z`; overlap respects order; persists.
  - Verify: e2e — overlap two blocks, reorder, save, reload asserts stacking.
  - Files: `src/editor/Canvas.tsx`, `src/editor/zorder.ts`, `e2e/editor-zorder.spec.ts`.

- [ ] **S10 Text preset blocks**
  - Acceptance: add Heading/Subheading/Body blocks; inline-edit text; preset fixes size/weight/line-height; alignment is the only per-block control; persists.
  - Verify: e2e — add each preset, type, save, public render matches preset styling.
  - Files: `src/editor/TextBlock.tsx`, `src/lib/presets.ts`, `src/server/blocks.ts`, `e2e/editor-text.spec.ts`.

- [ ] **S11 Upload + place image from editor**
  - Acceptance: upload UI calls S3.2, creates an image block on the canvas at intrinsic-derived size; persists.
  - Verify: e2e — upload fixture, block appears, save, public shows it.
  - Files: `src/editor/Upload.tsx`, `src/editor/Canvas.tsx`, `e2e/editor-upload.spec.ts`.

- [ ] **S12 Undo/redo (in-session)**
  - Acceptance: command stack undoes/redoes drag/resize/z/text/add/delete within the session; not persisted history.
  - Verify: unit tests on the command stack; e2e undo after a drag.
  - Files: `src/editor/history.ts`, `src/editor/model.ts`, `tests/history.test.ts`.

- [ ] **S13 Create page / subpage UI**
  - Acceptance: admin can create a page or subpage (title, slug, optional parent); slug validated/unique; appears in index.
  - Verify: e2e — create subpage, see it nested in index, open its editor.
  - Files: `src/routes/admin/index.tsx`, `src/server/pages.ts`, `src/lib/slug.ts`, `e2e/create-page.spec.ts`.
  - ⚠️ **Deletes must cascade in app code** — D1 doesn't enforce FK `ON DELETE CASCADE`. When page delete lands, delete child pages + blocks explicitly via `db.batch([...])` (see migration note / SPEC D1 caveat).

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

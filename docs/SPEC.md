# Spec: Photo Portfolio + Freeform Canvas Admin

> Status: **DRAFT — awaiting human approval** (Phase 1 of spec-driven-development)
> Last updated: 2026-06-13

## Objective

Build a **custom, self-hosted photo-portfolio website plus the admin app behind it**, end-to-end on Cloudflare.

- **Who:** A single admin (the site owner / photographer) and his public visitors.
- **Admin** logs in, uploads high-res photos, and lays out pages on a **freeform "physical table" canvas** — dragging, resizing, and overlapping photos and text blocks (heading / subheading / body) anywhere on the page, with an **optional snap-to-grid**. He can add pages and subpages.
- **Visitors** browse the finished pages plus an **auto-generated browsable index** (table of contents) of all pages and subpages.
- **Success looks like:** the owner independently creates a new page, drops in photos, freely places headings/subheadings/body text, saves, and it appears live + in the index — **without the developer in the loop and without touching code** — and it looks sharp on desktop and reflows sensibly on mobile.

### User stories

1. As the owner, I log in at `/admin` (Cloudflare Access) and see a list of my pages.
2. As the owner, I create a page (or subpage under an existing page) with a title and URL slug.
3. As the owner, I upload one or more high-res photos; they appear as blocks I can place.
4. As the owner, I drag/resize/overlap photo and text blocks freely on a fixed-width desktop canvas, optionally snapping to a grid, and reorder their stacking (z-index).
5. As the owner, I edit heading / subheading / body text blocks inline and style them within allowed controls.
6. As the owner, I save; the page is published live. I can undo changes within my editing session.
7. As a visitor, I open the site, browse the index, click into pages/subpages, and see fast, sharp images.
8. As a visitor on a phone, I see the page auto-reflowed into a readable single column.

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React, full-stack, SSR + server functions, file-based routing) — used where appropriate: SSR for public pages, client-interactive routes for the editor.
- **Runtime / hosting:** Cloudflare Workers (single Worker app — public site + admin + API).
- **Metadata DB:** Cloudflare D1 (SQLite) — pages, blocks, images metadata.
- **Blob storage:** Cloudflare R2 — original high-res uploads.
- **Image delivery:** Cloudflare Image Resizing via `/cdn-cgi/image/` — on-the-fly resize + format negotiation (AVIF/WebP/JPEG), edge-cached.
- **Auth:** Cloudflare Access (Zero Trust) gating `/admin/*` and the mutating API — no in-app auth code.
- **Canvas interactions:** `dnd-kit` (drag) + `interact.js` (resize/snap), over an app-owned layout model.
- **Build/tooling:** Vite (via TanStack Start), Wrangler for Cloudflare deploy, TypeScript throughout.

## Commands

```
Install:   pnpm install
Dev:       pnpm dev                  # Vite + Wrangler bindings (local D1 + R2)
Build:     pnpm build
Typecheck: pnpm typecheck            # tsc --noEmit
Lint:      pnpm lint                 # eslint . ; pnpm lint --fix to autofix
Test:      pnpm test                 # vitest run
Test (watch): pnpm test:watch        # vitest
E2E:       pnpm e2e                   # playwright test
Deploy:    pnpm deploy               # wrangler deploy
DB migrate (local):  pnpm db:migrate         # wrangler d1 migrations apply DB --local
DB migrate (remote): pnpm db:migrate:remote  # wrangler d1 migrations apply DB --remote
```

## Project Structure

```
photo-portfolio/
├─ src/
│  ├─ routes/                 → TanStack Start file routes
│  │  ├─ index.tsx            → public home (index/TOC)
│  │  ├─ p.$slug.tsx          → public page render (SSR)
│  │  └─ admin/               → admin editor routes (behind CF Access)
│  ├─ server/                 → server functions: pages, blocks, uploads
│  ├─ editor/                 → canvas editor (dnd-kit + interact.js, block model, undo)
│  ├─ render/                 → shared block renderer (used by public SSR + editor preview)
│  ├─ reflow/                 → desktop→mobile auto-reflow algorithm (pure, unit-tested)
│  ├─ db/                     → D1 schema, queries, migrations helpers
│  ├─ images/                 → R2 upload + /cdn-cgi/image URL builder
│  └─ lib/                    → shared utilities, types
├─ migrations/                → D1 SQL migrations
├─ tests/                     → unit/integration (vitest)
├─ e2e/                       → Playwright end-to-end
├─ docs/                      → SPEC.md, PLAN.md, decisions
├─ wrangler.toml              → Worker + D1 + R2 bindings
└─ package.json
```

## Data Model (D1)

```sql
-- pages: tree via parent_id; ordered within a parent
CREATE TABLE pages (
  id          TEXT PRIMARY KEY,          -- nanoid
  parent_id   TEXT REFERENCES pages(id), -- null = top level
  slug        TEXT NOT NULL UNIQUE,      -- url path segment, unique site-wide
  title       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- blocks: a page's freeform layout on a fixed-width desktop canvas
CREATE TABLE blocks (
  id         TEXT PRIMARY KEY,
  page_id    TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,              -- 'image' | 'heading' | 'subheading' | 'body'
  x          REAL NOT NULL,              -- canvas coords (px on CANVAS_WIDTH grid)
  y          REAL NOT NULL,
  width      REAL NOT NULL,
  height     REAL NOT NULL,
  z          INTEGER NOT NULL DEFAULT 0, -- stacking order
  image_id   TEXT REFERENCES images(id), -- for type='image'
  text       TEXT,                       -- for text types
  style      TEXT,                       -- JSON: font size, weight, align, color (allowed set)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- images: R2 object + intrinsic dimensions for aspect-ratio-correct rendering
CREATE TABLE images (
  id          TEXT PRIMARY KEY,
  r2_key      TEXT NOT NULL,             -- key of original in R2
  width       INTEGER NOT NULL,          -- intrinsic px
  height      INTEGER NOT NULL,
  bytes       INTEGER NOT NULL,
  mime        TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
```

Constants: `CANVAS_WIDTH = 1440` (desktop design width). Blocks position against this; the public renderer scales the canvas to the viewport.

> **D1 caveat — no runtime FK enforcement.** D1 does not enforce foreign keys (no persistent `PRAGMA foreign_keys = ON`), so the `ON DELETE CASCADE` clauses above will **not** fire. Deletes that should cascade (page → blocks, page → child pages, image → blocks) must be done explicitly and atomically in app code via `db.batch([...])`. The FK declarations stay as intent/documentation.

## Hard Part 1 — The Canvas Editor

The bulk of the work. Requirements:

- Drag any block to any (x, y); resize from handles; overlap allowed; z-order controls (bring forward / send back).
- **Snap-to-grid** toggle (e.g. 8px grid + edge/center alignment guides); off = free placement.
- Text blocks are inline-editable (contentEditable) using **named presets, Notion-style** — `Heading` / `Subheading` / `Body` (each preset fixes font size, weight, line-height; alignment is the only per-block control). No arbitrary size/color/CSS in v1.
- Image blocks maintain aspect ratio on resize by default (with an unlock).
- **Undo/redo within the editing session** (in-memory command stack; not server-side history in v1).
- Save persists the full block set for the page (publish-on-save; no drafts in v1).
- Implemented with `dnd-kit` (drag) + `interact.js` (resize/snap) feeding an **app-owned layout model** (single source of truth in React state), so persistence and reflow read from our model, not the DOM.

## Hard Part 2 — Auto-Reflow (desktop → mobile)

Pure, deterministic, unit-tested function: `reflow(blocks, canvasWidth, mobileWidth) → mobileBlocks`.

- v1 algorithm: sort blocks by `(y, x)` (top-to-bottom, then left-to-right), then stack vertically at full mobile width, preserving each block's aspect ratio (images) or natural height (text), with consistent vertical spacing.
- Overlapping/grouped blocks: blocks whose vertical ranges substantially overlap on desktop are treated as a row and may be kept side-by-side OR stacked (v1: stack; revisit). Document the tie-breaking rules.
- Reflow runs at render time on the public page based on viewport; no separate stored mobile layout.
- This module is **pure and has no DOM/Cloudflare deps** → fully unit-testable in isolation.

## Browsable Index

- Auto-generated from the `pages` tree (`parent_id` + `sort_order`).
- Renders as a nested table-of-contents on the home route and/or a dedicated `/index` route.
- No full-text search in v1 (out of scope) — "scour by eye" over dozens of pages.

## Code Style

TypeScript, functional React, explicit types at module boundaries. Pure logic (reflow, layout math) separated from IO (D1/R2) and from React.

```ts
// reflow/reflow.ts — pure, no IO, no DOM. This is the style for core logic.
export interface Block {
  id: string;
  type: "image" | "heading" | "subheading" | "body";
  x: number; y: number; width: number; height: number; z: number;
}

/** Stack desktop blocks into a single mobile column, preserving aspect ratios. */
export function reflow(blocks: Block[], mobileWidth: number): Block[] {
  const ordered = [...blocks].sort((a, b) => a.y - b.y || a.x - b.x);
  let cursorY = 0;
  return ordered.map((b) => {
    const scale = mobileWidth / b.width;
    const height = b.height * scale;
    const placed = { ...b, x: 0, y: cursorY, width: mobileWidth, height };
    cursorY += height + MOBILE_GAP;
    return placed;
  });
}
```

- Naming: `camelCase` values, `PascalCase` types/components, kebab-case files for non-components.
- No arbitrary user CSS — text styling is **named presets** (`Heading`/`Subheading`/`Body`), validated against the allowed set; alignment is the only per-block style.
- Server functions validate all input (slugs, coordinates, block types) before touching D1/R2.

## Testing Strategy

- **Framework:** Vitest (unit/integration) + Playwright (e2e).
- **Unit (highest value):** `reflow/` algorithm (deterministic, many fixture layouts → expected mobile stacks); slug validation; `/cdn-cgi/image` URL builder; block-model command/undo stack.
- **Integration:** server functions against local D1 (Miniflare/Wrangler) — create page, add blocks, upload image (mock R2), fetch public render.
- **E2E (Playwright):** create page → upload photo → drag/resize/snap → save → view public page → confirm it appears in the index; mobile viewport reflow smoke test.
- **Coverage expectation:** core logic (`reflow`, layout model, validators) ≥ 90%; routes/server functions covered by integration + e2e rather than line-coverage targets.
- Tests live in `tests/` (unit/integration) and `e2e/` (Playwright).

## Boundaries

- **Always:** run `pnpm typecheck && pnpm test` before commits; validate all admin inputs server-side; keep `reflow`/layout logic pure and unit-tested; serve images through `/cdn-cgi/image` (never raw originals to visitors).
- **Ask first:** changing the D1 schema (write a migration); adding runtime dependencies; changing the canvas coordinate model or `CANVAS_WIDTH`; enabling any paid Cloudflare product beyond R2/D1/Workers/Image Resizing; changing the auth model away from Cloudflare Access.
- **Never:** commit secrets or `wrangler` credentials; expose mutating endpoints outside the Cloudflare Access gate; allow arbitrary CSS/HTML injection via text blocks; serve un-resized originals on public pages; delete failing tests to go green.

## Success Criteria (testable)

1. Owner can create a page/subpage and it appears in the public index without code changes.
2. Owner can upload a ≥ 20MP photo; it stores the original in R2 and serves a resized AVIF/WebP variant ≤ ~300KB at typical display sizes; LCP image on a page < 2.5s on simulated 4G.
3. Owner can drag, resize, overlap, snap-to-grid (toggle), and z-order blocks; undo reverts the last action within the session.
4. Saving publishes; reloading the public page shows the exact saved layout.
5. The same page on a 390px-wide viewport renders as a single readable column via `reflow`, with no horizontal scroll and images aspect-correct.
6. `/admin/*` and all mutating endpoints are inaccessible without passing Cloudflare Access.
7. `reflow` unit tests pass for ≥ 8 representative layouts; core-logic coverage ≥ 90%.

## Out of Scope (v1)

- Full-text search (browsable index only).
- Multi-user / team accounts / roles (single admin).
- E-commerce / print sales.
- Blog / comments / social.
- Manual, hand-placed mobile layouts (mobile is auto-reflow only).
- Server-side version history / drafts (undo is in-session only; save publishes live).
- Arbitrary CSS/theming by the admin (constrained style controls only).

## Resolved Decisions

1. **Reflow rows:** side-by-side desktop images **stack** vertically on mobile (no 2-up preservation in v1).
2. **Snap grid:** 8px grid + smart edge/center alignment guides; toggle for free placement.
3. **Text styling:** named **Heading / Subheading / Body** presets (Notion-style); alignment is the only per-block control; no arbitrary size/color/CSS.
4. **Cloudflare provisioning:** deploy to **`tevo.rafee.cloud`**, a subdomain of the existing Cloudflare-managed zone `rafee.cloud` (temporary host for now). This unblocks Access + Image Resizing without a new domain. Phase 0 (below) stands up the account resources, the subdomain route, and bindings. _Assumption: `rafee.cloud` nameservers already point at Cloudflare; if not, Phase 0 starts with a nameserver move._
5. **Originals:** full-res originals in R2 are **admin-only**; visitors only ever receive `/cdn-cgi/image`-resized variants. No public download.

## Phase 0 — Provisioning / Scaffold (nothing exists yet)

Because no Cloudflare resources or domain exist, the build starts here. These are **"ask first" infrastructure steps** — confirm/perform before app code:

- Use the existing Cloudflare zone **`rafee.cloud`**; create the **`tevo.rafee.cloud`** subdomain and a Worker custom-domain/route for it. (Zone already provides what Access + Image Resizing need.)
- `wrangler` authenticated locally; create `wrangler.toml` with bindings + the `tevo.rafee.cloud` route.
- Create **D1** database (`wrangler d1 create`) → bind as `DB`.
- Create **R2** bucket (`wrangler r2 bucket create`) → bind as `BUCKET`.
- Enable **Image Resizing** on the zone (and confirm `/cdn-cgi/image` is available).
- Configure **Cloudflare Access** (Zero Trust): application covering `/admin/*` + mutating API paths; policy allowing the owner's identity (Google / email OTP).
- Scaffold the TanStack Start app targeting the Cloudflare Workers preset; verify a hello-world Worker deploys.
- First D1 migration creating the `pages` / `blocks` / `images` tables.

Local dev uses `--local` D1 + R2 via Wrangler/Miniflare so most work needs no live account; the live provisioning above is needed for Access, the real domain, and Image Resizing end-to-end.
```

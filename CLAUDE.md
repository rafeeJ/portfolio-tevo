# CLAUDE.md — Photo Portfolio + Canvas Admin

Context for any agent working in this repo. **Read `docs/SPEC.md` and `tasks/todo.md` before doing anything.**

## What this is

A custom, self-hosted **photo-portfolio website + admin app**, built end-to-end on Cloudflare. A single admin (the owner) logs in, uploads high-res photos, and lays out pages on a **freeform "physical table" canvas** (drag/resize/overlap photos + text blocks, optional snap-to-grid). Public visitors browse the pages + an auto-generated browsable index. Mobile is automatic reflow of the desktop layout.

## Source of truth (read in this order)

1. `docs/SPEC.md` — the spec: objective, data model, decisions, success criteria, boundaries.
2. `docs/PLAN.md` — phased implementation plan + risks.
3. `tasks/plan.md` — vertical-slice rationale + dependency graph + checkpoints.
4. `tasks/todo.md` — the executable task checklist. **Work one task at a time, in order.**

Keep these alive: if a decision changes, update the spec first, then code.

## Git workflow (REQUIRED for all work)

**Never commit feature work directly to `main`.** For each task (or small task group):

1. **Branch** off `main`: `git checkout -b task/<slug>` (e.g. `task/s4-reflow`).
2. **Implement** the task to its Definition of Done (typecheck + tests green).
3. **Quality gate before merge — both, in order:**
   - Run **`/thermo-nuclear-code-quality-review`** on the branch and address findings.
   - Run **`/deslop`** to strip AI-slop / clean style.
4. **Check in with the human** if the review surfaces any open questions or judgment calls — don't merge through ambiguity.
5. **Merge back into `main`** (no PR required): `git checkout main && git merge --no-ff task/<slug>`, then push. Delete the branch.

Notes:
- `/thermo-nuclear-code-quality-review` is the user's deep review pass. **The harness blocks agents from auto-invoking it** (`disable-model-invocation`), so apply its rubric inline (be transparent that you're doing so) or ask the user to run it; `/deslop` *can* be invoked normally.
- `main` stays releasable; the initial scaffold (F0.1) and bindings (F0.2) baseline live there. Everything after branches.

## Deploy = CI (Workers Builds), not manual

The GitHub repo is connected to the `tevo` Worker via **Cloudflare Workers Builds**. **Pushing `main` auto-builds and deploys.** Do **not** run `pnpm deploy` by hand any more — it races the CI deploy. Just `git push` and watch the build.

- Dashboard build config (Worker → Settings → Builds): **Build command** `pnpm run build`, **Deploy command** `npx wrangler deploy`. Package manager auto-detected as pnpm from `pnpm-lock.yaml` (pinned via `packageManager` in `package.json`).
- ⚠️ **CI does not run D1 migrations.** `wrangler deploy` ships code only. When a change adds a migration, run `pnpm db:migrate:remote` yourself (before or right after the deploy), or the remote schema drifts. No auto-migrate in the build.
- Inspect builds with the `cloudflare-builds` MCP tools (`workers_builds_list_builds` / `_get_build_logs`), Worker id `c7e3c632322f446caac2d64157eb9f5a`.

## Stack (decided — do not swap without asking)

- **Framework:** TanStack Start (React, SSR + server functions) on **Cloudflare Workers**.
- **DB:** Cloudflare **D1** (SQLite) — `pages`, `blocks`, `images` (schema in `docs/SPEC.md`). Bound as `DB`.
- **Blobs:** Cloudflare **R2** — original high-res uploads, **admin-only** (never served to public). Bound as `BUCKET`.
- **Image delivery:** Cloudflare **Image Resizing** via `/cdn-cgi/image/` — resized AVIF/WebP variants, edge-cached. Public pages only ever get variants.
- **Auth:** **Cloudflare Access** (Zero Trust) gates `/admin/*` + all mutating endpoints. No in-app auth code.
- **Canvas:** `dnd-kit` (drag) + **raw pointer-event corner handles** (resize) over an **app-owned layout model** (React state is the single source of truth; the DOM is never authoritative). All coordinate math lives in the pure, unit-tested `src/editor/geometry.ts`. _(Spec named interact.js for resize/snap; we use raw handles instead to avoid two libraries competing for the same pointer events — see S7.)_
- **Host:** `tevo.rafee.cloud` (subdomain of the existing Cloudflare zone `rafee.cloud`).

## ⚠️ Use the Cloudflare skills — don't guess

For ANY Cloudflare work (Workers, D1, R2, Image Resizing, Access, `wrangler.toml`, deploy), **invoke the `cloudflare:cloudflare` skill** (and `cloudflare:wrangler`, `cloudflare:workers-best-practices` as needed). These bias toward current Cloudflare docs over pre-trained knowledge — Cloudflare's APIs move fast and stale patterns will bite. Do not hand-write `wrangler.toml`, binding code, or D1/R2 calls from memory.

## Conventions

- TypeScript everywhere; explicit types at module boundaries.
- **Separate pure logic from IO and from React.** `reflow/`, layout math, validators, the image URL builder are pure and heavily unit-tested (≥90%). D1/R2 access lives in `src/server` / `src/db` / `src/images`. React lives in `src/routes` / `src/editor` / `src/render`.
- One shared block renderer (`src/render/`) used by BOTH public SSR and the editor preview — never two renderers.
- Text styling = named **Heading/Subheading/Body** presets (Notion-style). No arbitrary CSS/color/size; alignment is the only per-block control.
- Canvas coords are on a fixed `CANVAS_WIDTH = 1440` design width; the renderer scales to viewport.
- Validate all admin input server-side before touching D1/R2.

## Commands

```
pnpm install
pnpm dev                 # Vite + Wrangler (local D1 + R2)
pnpm build
pnpm typecheck           # tsc --noEmit
pnpm lint                # eslint .
pnpm test                # vitest run
pnpm e2e                 # playwright test
pnpm db:migrate          # wrangler d1 migrations apply DB --local
pnpm db:migrate:remote   # wrangler d1 migrations apply DB --remote
pnpm deploy              # wrangler deploy
```

## Definition of done (every task)

`pnpm typecheck && pnpm test` green · the task's acceptance check passes · ≤ ~5 files touched · no scope outside the task. UI slices add/extend a Playwright e2e. Stop at the checkpoint (CP-A…E) for human review.

## Boundaries

- **Always:** run typecheck + tests before commit; validate admin input; keep pure logic pure + tested; serve images only via `/cdn-cgi/image`.
- **Ask first:** D1 schema changes (write a migration); new runtime deps; changing the canvas coordinate model or `CANVAS_WIDTH`; enabling paid CF products beyond R2/D1/Workers/Image Resizing; changing auth away from Access.
- **Never:** commit secrets/wrangler creds; expose mutating endpoints outside the Access gate; allow arbitrary CSS/HTML via text blocks; serve un-resized originals publicly; delete failing tests to go green.

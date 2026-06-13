# Implementation Plan: Photo Portfolio + Canvas Admin

> Status: **DRAFT — awaiting human approval** (Phase 2 of spec-driven-development)
> Derived from `docs/SPEC.md`. Last updated: 2026-06-13.

## Build order (phases)

Ordered by dependency. Each phase ends at a **verification checkpoint** the human can review before the next begins.

### Phase 0 — Provision & scaffold (infra; "ask first" steps)
Stand up Cloudflare resources on the existing `rafee.cloud` zone, create the `tevo.rafee.cloud` subdomain + Worker route, bindings, and a deployable hello-world.
- **Why first:** everything else binds to D1/R2; Access + Image Resizing need the zone + route.
- **Risk:** Access setup is account-level and can't be fully mocked. Mitigation: do app dev against local D1/R2 (Miniflare); treat live Access/route as a parallel infra track that only gates the *public launch*, not local progress. (Zone `rafee.cloud` assumed already on Cloudflare DNS; if not, a nameserver move precedes everything.)
- **Checkpoint:** `wrangler deploy` serves a hello-world Worker; `pnpm dev` runs locally with bound local D1 + R2; first migration creates the three tables.

### Phase 1 — Data layer & server functions (no UI)
D1 schema/migrations, typed query layer, and server functions for pages/blocks/images CRUD. R2 upload + image-metadata extraction. `/cdn-cgi/image` URL builder.
- **Depends on:** Phase 0 bindings.
- **Risk:** image dimension extraction in a Worker (no node `image-size`). Mitigation: parse intrinsic width/height from the upload (client sends dimensions, server validates) or a small wasm/header parser; decide in this phase.
- **Checkpoint:** integration tests green — create page → add blocks → upload image (local R2) → read back; URL builder unit tests pass.

### Phase 2 — Public render path (read-only site)
SSR public pages from the block model, the shared block renderer, and the auto-generated index/TOC. Wire `/cdn-cgi/image` variants + responsive `srcset`.
- **Depends on:** Phase 1 data layer (can start the renderer against seed/fixture data in parallel with Phase 1 finishing).
- **Risk:** canvas-coordinate → responsive scaling. Mitigation: render the 1440px canvas in a scaled container; lock down the scaling math with tests.
- **Checkpoint:** a hand-seeded page renders correctly on desktop; index lists the page tree; Lighthouse image/LCP sane.

### Phase 3 — Auto-reflow (pure module)
`reflow(blocks, mobileWidth)` + its test suite. Hook it into the public renderer for narrow viewports.
- **Depends on:** the block type from Phase 1; renderer from Phase 2. The pure function itself depends on **nothing** and can be built/tested first or in parallel.
- **Risk:** edge cases (overlaps, tall text). Mitigation: ≥ 8 fixture layouts with expected outputs (spec success criterion #7).
- **Checkpoint:** reflow unit tests green (≥ 90% coverage); 390px viewport shows single-column, no horizontal scroll.

### Phase 4 — Canvas editor (the bulk)
The admin editor: block model + in-session undo/redo command stack; dnd-kit drag; interact.js resize; snap-to-grid (8px) + smart guides; z-order controls; inline text presets (Heading/Subheading/Body); image upload UI; save → publish.
- **Depends on:** Phases 1 (persistence) and 2 (shared renderer for preview).
- **Risk:** highest-bug surface. Mitigation: app-owned layout model as single source of truth (libs feed it, DOM never authoritative); build sub-parts in this order — model+undo (unit-tested) → drag → resize → snap/guides → text presets → upload → save.
- **Checkpoint:** e2e — create page → upload → drag/resize/snap → undo → save → reload shows saved layout.

### Phase 5 — Access gate, hardening, launch
Apply Cloudflare Access to `/admin/*` + mutating API; input validation pass; deploy to the live domain; full e2e on production-like env.
- **Depends on:** Phase 0 Access config + all features.
- **Risk:** mutating endpoints reachable outside the gate. Mitigation: explicit test that unauthenticated mutation requests are rejected (spec success criterion #6).
- **Checkpoint:** all spec success criteria 1–7 pass; `/admin` unreachable without Access.

## Dependency graph (what can overlap)

```
Phase 0 ──┬─→ Phase 1 ──┬─→ Phase 2 ─┐
          │             │            ├─→ Phase 4 ─→ Phase 5
          │             └─→ Phase 3 ─┘
          └─(infra track: domain/DNS/Access — parallel, gates Phase 5 launch only)

Phase 3 (pure reflow) can begin any time after the Block type exists.
```

## Cross-cutting risks

| Risk | Where | Mitigation |
|---|---|---|
| Canvas editor scope creep / bugs | Phase 4 | App-owned model; incremental sub-parts; e2e per increment |
| Image dimension extraction in Workers | Phase 1 | Client-sends-dimensions + server validation; decide early |
| Coordinate→responsive scaling drift | Phase 2/3 | Pure scaling math, unit-tested; one renderer for SSR + editor preview |
| Access misconfig exposes admin | Phase 5 | Negative test for unauth mutations; gate at edge not in app |
| Live infra can't be mocked | Phase 0 | Local D1/R2 for dev; infra as parallel track gating launch only |

## Verification discipline

- Every phase ends green on `pnpm typecheck && pnpm test`; Phases 2/4/5 add Playwright e2e.
- Pure logic (`reflow`, layout model, validators, URL builder) carries the coverage weight (≥ 90%); routes are covered by integration + e2e.
- Spec success criteria are the acceptance gate for Phase 5.

## Next step

On approval, Phase 3 (Tasks) breaks each phase above into discrete tasks (≤ ~5 files each) with explicit acceptance + verify steps, following the task template in the spec skill.

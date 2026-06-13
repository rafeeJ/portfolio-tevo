# Task Plan: Photo Portfolio + Canvas Admin

> Status: **DRAFT — awaiting human approval** (Phase 3 of spec-driven-development)
> Source: `docs/SPEC.md`, `docs/PLAN.md`. Vertical-slice breakdown. Last updated: 2026-06-13.

## Approach: vertical slices, not horizontal layers

Each slice below delivers **one complete, observable path** — you can look at the result and see it work — rather than building a whole layer (all DB, then all rendering). After the unavoidable thin foundation (F0), every slice ends with something demoable.

The canvas editor (the bulk per the spec) is deliberately cut into **small interaction slices** (drag, then resize, then snap…), each independently testable, because it's the highest-bug surface.

## Dependency graph

```
F0 Foundation (scaffold + bindings + migration)
        │
        ▼
S1 Render a seeded page  ──►  S2 Browsable index
        │                          
        ▼                          
S3 Image upload + resize pipeline
        │
        ▼
S4 Mobile auto-reflow (pure; can start once Block type exists in S1)
        │
        ▼
EDITOR SLICES (each builds on the prior, all behind local /admin):
  S5 Editor shell (load + render blocks read-only on canvas)
  S6 Drag + persist
  S7 Resize + persist
  S8 Snap-to-grid + smart guides
  S9 Z-order controls
  S10 Text preset blocks (add/edit Heading/Subheading/Body)
  S11 Upload image from editor + place
  S12 Undo/redo (in-session)
  S13 Create page / subpage UI
        │
        ▼
INFRA TRACK (parallel; gates launch only):
  I1 Subdomain route on rafee.cloud   I2 Cloudflare Access   I3 Image Resizing enabled
        │
        ▼
S14 Launch hardening: apply Access gate, validation pass, deploy to tevo.rafee.cloud, full e2e
```

**Parallelism:** S4 (pure reflow) can begin the moment the `Block` type lands in S1. The infra track (I1–I3) is independent of all app slices and only needs to be done before S14. Everything else is sequential by dependency.

## Checkpoints (human-reviewable gates)

- **CP-A (after F0):** hello-world Worker deploys; local D1+R2 bound; tables migrated.
- **CP-B (after S2):** a seeded page renders at `/p/:slug` and appears in the index. *First visible site.*
- **CP-C (after S4):** images go through the resize pipeline; page reflows to one column at 390px. *Public read-path complete.*
- **CP-D (after S13):** full editor works locally — create page, upload, drag/resize/snap/z-order/text/undo, save, reload shows saved layout. *Admin complete.*
- **CP-E (after S14):** all spec success criteria 1–7 pass on `tevo.rafee.cloud`; `/admin` unreachable without Access. *Launch.*

## Risk notes (carried from PLAN.md)

- Image dimensions in a Worker → client-sends-dimensions + server-validates (decided in S3).
- Canvas→responsive scaling → one shared renderer for SSR + editor preview, scaling math unit-tested (S1/S5).
- Access misconfig → explicit negative test for unauth mutations (S14).
- Editor bug surface → small slices S6–S12, each with its own e2e.

## Definition of done (every task)

`pnpm typecheck && pnpm test` green; task's own acceptance check passes; ≤ ~5 files touched; no scope outside the task. Slices touching UI add/extend a Playwright e2e.

See `tasks/todo.md` for the executable checklist.

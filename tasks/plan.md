# Implementation Plan: Effect-core field guides

## Overview

The catalog covers the Effect types a backend reaches for first (Effect, Layer, Stream,
Ref/Queue, Schedule, …) but leaves several **core** modules with no page. This batch fills
the highest-value gaps, each as the repo's standard **vertical slice**: a typechecked
`examples/reference/<slug>.ts` (carved into `// #region`s) → house-style
`app/reference/<slug>/page.tsx` → a `lib/catalog.ts` field-guide entry → an `ICONS` entry
in `app/page.tsx`. Guarded by `lib/catalog.test.ts` + `tsc` + `next build`.

All APIs verified against the installed `effect@4.0.0-rc.112` (and `repos/effect`), never
the drifted `~/.local/share` clone.

## Topics (priority order)

| # | Slug | Title | Core modules |
|---|------|-------|--------------|
| 1 | `schema` | Schema — the whole map | `Schema` (Struct, Class, filter, transform, brand, Union) |
| 2 | `coordination` | Coordination & limits | `Semaphore`, `Deferred`, `Latch`, `Pool` |
| 3 | `pubsub` | PubSub | `PubSub` (broadcast to many subscribers) |
| 4 | `stm` | Software Transactional Memory | `TxRef`, `TxQueue`, `TxHashMap`, atomic transactions |
| 5 | `collections` | Immutable collections | `Chunk`, `HashMap`, `HashSet`, `Array` utils |
| 6 | `random` | Random | `Random` — deterministic, testable randomness |

## Architecture Decisions

- **Field guides, under `/reference`.** These are core (not backend-specific) modules, so
  they join `fieldGuideData` and route to `/reference/<slug>` — same as effect/errors/etc.
  Schema gets the dense "whole map" treatment in its title/body but stays a field guide for
  routing consistency (the `wholeMaps` array is hard-routed to `/backend`).
- **One topic per task, additive only.** Each touches `lib/catalog.ts` (append to
  `fieldGuideData`) and `app/page.tsx` (one `ICONS` entry) — serialize those edits; build
  examples + pages in parallel-safe isolation otherwise.
- **Source-of-truth first.** Every example compiles under `tsc --noEmit`; a wrong API fails
  the build. Research each module against `node_modules/effect/src` before writing.

## Dependency Graph

```
Existing field guides (effect, ref-queue, scope, concurrency, data-match, …)
        │
        ├── schema ........... independent; extends lesson 03's intro
        ├── coordination ..... builds on concurrency + scope (Pool is scoped)
        ├── pubsub ........... sibling of ref-queue's Queue
        ├── stm .............. builds on ref-queue (Tx* is the transactional Ref family)
        ├── collections ...... independent
        └── random ........... independent; pairs with the Clock/Time testability theme
```

## Task List

### Phase 1 — Schema (highest leverage)
- [ ] **Task 1 — `schema`: Schema — the whole map**

#### Checkpoint A
- [ ] `pnpm test` (catalog ↔ routes) · `pnpm typecheck` · `pnpm build` green
- [ ] Renders in `pnpm dev`; human review of depth before continuing

### Phase 2 — Coordination & messaging
- [ ] **Task 2 — `coordination`: Semaphore · Deferred · Latch · Pool**
- [ ] **Task 3 — `pubsub`: PubSub broadcast**

#### Checkpoint B — guards green, human review

### Phase 3 — Data & determinism
- [ ] **Task 4 — `stm`: Software Transactional Memory**
- [ ] **Task 5 — `collections`: Chunk · HashMap · HashSet**
- [ ] **Task 6 — `random`: deterministic randomness**

#### Checkpoint C — full verify, browser check, PR

## Per-task shape (all identical)
**Files:** new `examples/reference/<slug>.ts` + new `app/reference/<slug>/page.tsx` +
`lib/catalog.ts` entry + `app/page.tsx` ICONS entry.
**Verify:** `pnpm typecheck` · `pnpm test` · `pnpm build` · manual check in `pnpm dev`.
**Done:** all four green and the card is reachable from the home grid.

## Risks
| Risk | Mitigation |
|------|------------|
| Schema v4-beta API differs from v3 muscle memory | Verify every symbol in `node_modules/effect/src/Schema.ts`; tsc is the gate |
| STM / Pool APIs intricate | Research first; demote uncertain bits to a ModuleNote rather than ship non-compiling code |
| catalog.ts / page.tsx edit collisions | Serialize those two edits across tasks |

# Implementation Plan: Topics still to cover

## Overview

The tutorial teaches **Effect v4 (beta.78) for a Next.js backend**, "one real question at
a time." Every catalog entry that exists is `ready: true`, so the work isn't finishing
half-built pages — it's **filling gaps in coverage**. The sequential lesson path stops at
*05 — Talking to a database*, and several core backend concerns (testing, auth,
observability, caching, background work) have no page anywhere.

This plan proposes the missing topics, ordered by impact, each as a **self-contained
vertical slice** that matches the repo's established shape.

## What already exists (so we don't duplicate it)

- **Lessons (sequential):** 01 server · 02 endpoints · 03 schemas · 04 services & layers · 05 database
- **Whole maps:** http · httpapi · sql · global-runtime
- **Field guides:** effect · errors · layers · concurrency · stream · option-result · data-match · ref-queue · scope · config · schedule

## The biggest gaps (verified against installed `effect@4.0.0-beta.78`)

| Gap | Why it matters | API exists? |
|---|---|---|
| **Testing** | Lesson 04 sells "swap it for tests" but there is no payoff page. Foundational. | ✅ `effect/testing` (`TestClock`, `TestConsole`, `TestSchema`). ⚠️ `@effect/vitest` **not** installed — see Open Questions. |
| **Auth & middleware** | The most-asked backend question; nothing covers protecting an endpoint. | ✅ `HttpMiddleware`, `HttpApiMiddleware`, `HttpApiSecurity` |
| **Observability** | Logging/tracing/metrics is Effect's standout backend capability; absent. | ✅ `Logger`, `Metric`, `Tracer` |
| **Cache & batching** | The N+1 problem the SQL repo invites; no answer yet. | ✅ `Cache`, `ScopedCache`, `RequestResolver` |
| **Background work & scheduling** | Running work off the request path; `schedule` guide covers *policies* only. | ✅ `Cron`, `FiberSet`, `FiberHandle`, `FiberMap` |
| **Time** (DateTime/Duration/Clock) | Common, small, and underpins the `TestClock` story in Testing. | ✅ `DateTime`, `Duration`, `Clock` |

## The per-topic deliverable (the repo's unit of work)

Every topic — lesson or field guide — is the **same vertical slice**:

1. `examples/<area>/<slug>.ts` — typechecked example carved into `// #region <name>` snippets.
2. `app/<area>/<slug>/page.tsx` — the page that renders those regions in the house style
   (`LessonShell`, `ScrollStack`, `CodeFrame`, `Prose`, etc.).
3. `lib/catalog.ts` — one entry added to `lessonData` / `wholeMapData` / `fieldGuideData`.
4. `app/page.tsx` — one `ICONS` entry (field guides & whole maps only; lessons use the numeral).
5. **Guards pass:** `lib/catalog.test.ts` (catalog ↔ routes), `pnpm typecheck`, `pnpm build`.

`area` is `backend` for lessons/whole-maps, `reference` for field guides.

## Architecture Decisions

- **Match the source of truth.** Every API in a new example must be verified against
  `node_modules/effect` (or the pinned submodule `repos/effect`), never the drifted
  `~/.local/share` clone. The example file is typechecked by `tsc --noEmit`, so a wrong
  API fails the build — keep that guard green as the definition of "done."
- **One topic per task.** Each topic is an independent slice (M-sized, 3–5 files). They
  can be built in any order and parallelized, *except* they all touch `lib/catalog.ts`
  and field guides/whole-maps touch `app/page.tsx` — serialize the catalog edit or expect
  trivial merge conflicts there.
- **Extend the path, don't renumber.** New lessons append as 06, 07, … so `nextLesson`
  keeps working and existing routes/links never move.
- **Field guide vs. lesson.** A *lesson* is a sequential, narrative build that adds to the
  06→ chain. A *field guide* is an out-of-sequence reference map. Testing/Auth/Background
  are narrative → lessons. Cache, Time, Observability are reference maps → field guides
  (Observability could also be a lesson; see Open Questions).

## Dependency Graph

```
Existing foundation (01–05, http, httpapi, sql)
        │
        ├── Lesson 06: Testing ............ depends on 04 (layers) + 05 (db); pairs with Time guide (TestClock)
        ├── Lesson 07: Auth & middleware .. depends on httpapi + httpapi-reference
        ├── Lesson 08: Background work .... depends on schedule guide + (new) Fibers/Time
        │
        ├── Guide: Observability .......... mostly independent
        ├── Guide: Cache & batching ....... depends on 05 (db) for the N+1 motivation
        └── Guide: Time (DateTime/Dur) .... independent; supports Testing
```

## Task List

### Phase 1 — Close the learning-path holes (highest impact)

- [ ] **Task 1 — Lesson 06: Testing your backend**
- [ ] **Task 2 — Field guide: Time (DateTime · Duration · Clock)**  *(small; unblocks the TestClock story)*

#### Checkpoint A — after Tasks 1–2
- [ ] `pnpm test` green (catalog ↔ routes) · `pnpm typecheck` · `pnpm build` clean
- [ ] Lesson 06 reachable from 05 via the next-lesson chain; renders in `pnpm dev`
- [ ] Human review of tone/depth vs. existing lessons before continuing

### Phase 2 — Core backend concerns

- [ ] **Task 3 — Lesson 07: Auth & middleware** *(invoke `security-and-hardening` skill first)*
- [ ] **Task 4 — Field guide: Observability (logging · spans · metrics)**

#### Checkpoint B — after Tasks 3–4
- [ ] Guards green (test/typecheck/build)
- [ ] Auth example shows a *rejected* request path, not just the happy path
- [ ] Human review

### Phase 3 — Performance & background work

- [ ] **Task 5 — Field guide: Cache & batching (Cache · RequestResolver)**
- [ ] **Task 6 — Lesson 08: Background work & scheduling (Cron · FiberSet)**

#### Checkpoint C — complete
- [ ] All guards green · all new pages reachable from the home grid
- [ ] Catalog test still enforces every route ↔ entry
- [ ] Final human review / ready to ship

## Task detail

> Each task shares the same **verification**: `pnpm test` (catalog guard) · `pnpm typecheck`
> (example compiles against the real beta) · `pnpm build` (page renders) · manual check in
> `pnpm dev`. Each shares the same **files touched**: a new `examples/…ts`, a new
> `app/…/page.tsx`, an edit to `lib/catalog.ts`, and (field guides/whole-maps) an `ICONS`
> entry in `app/page.tsx`. Scope is **M** unless noted.

### Task 1 — Lesson 06: Testing your backend
**Description:** Deliver on Lesson 04's promise: write a test that swaps the live `UserRepo`
Layer for a fake one, asserts on outcomes, and uses `TestClock` to drive time-dependent
logic without waiting. Show the test pyramid for an Effect handler.
**Acceptance criteria:**
- [ ] Example builds a fake `UserRepo` Layer and provides it in a test, no real DB.
- [ ] Demonstrates `TestClock` advancing a `Schedule`/timeout deterministically.
- [ ] Page renders the regions and links forward/back in the lesson chain.
**Dependencies:** 04, 05. Pairs well with Task 2.
**Risk:** `@effect/vitest` is not installed — see Open Questions; the example may use core
`effect/testing` + plain `vitest` instead, or we add the dep.

### Task 2 — Field guide: Time (DateTime · Duration · Clock)  — **Scope: S**
**Description:** A short map of `Duration` (construct/compare), `DateTime` (now, math,
zones), and `Clock` (why you read time as an Effect — so `TestClock` can fake it).
**Acceptance criteria:**
- [ ] Regions for Duration, DateTime, and Clock-vs-`Date.now()`.
- [ ] Adds `time` to `fieldGuideData` + an `ICONS` entry (e.g. `Clock`/`CalendarClock`).
**Dependencies:** None. Strengthens Task 1.

### Task 3 — Lesson 07: Auth & middleware
**Description:** Protect an endpoint. Define an `HttpApiMiddleware` that reads a token via
`HttpApiSecurity`, provides an authenticated-user service to handlers, and rejects missing/
bad credentials with a typed error that renders as 401.
**Acceptance criteria:**
- [ ] Example shows the middleware, a protected endpoint, and the *unauthorized* path.
- [ ] The authenticated principal is available to the handler as a service.
- [ ] `security-and-hardening` skill consulted before writing (per global CLAUDE.md).
**Dependencies:** httpapi, httpapi-reference.

### Task 4 — Field guide: Observability (logging · spans · metrics)
**Description:** Structured `Logger` (levels, annotations), tracing with `Effect.withSpan`/
`Tracer`, and a `Metric` (counter/histogram) around a handler. How they compose with Layers.
**Acceptance criteria:**
- [ ] Regions for logging, spans, and metrics, each runnable.
- [ ] Adds `observability` to `fieldGuideData` + `ICONS` entry.
**Dependencies:** None.

### Task 5 — Field guide: Cache & batching (Cache · RequestResolver)
**Description:** Answer the N+1 the SQL repo invites: memoize reads with `Cache`/
`ScopedCache`, and batch many keyed lookups with `RequestResolver`.
**Acceptance criteria:**
- [ ] Regions for `Cache` (lookup, TTL/capacity) and `RequestResolver` batching.
- [ ] Adds `cache` to `fieldGuideData` + `ICONS` entry.
**Dependencies:** 05 (for the motivating example).

### Task 6 — Lesson 08: Background work & scheduling
**Description:** Run work off the request path: fork a fiber into a `FiberSet`, schedule a
recurring job with `Schedule`/`Cron`, and shut it down cleanly via Scope.
**Acceptance criteria:**
- [ ] Example forks a managed background fiber and a `Cron`-scheduled job.
- [ ] Shows clean shutdown (no leaked fibers) tied to a Scope/Layer.
**Dependencies:** schedule guide, scope guide; pairs with Task 2.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| `@effect/vitest` not installed | Med | Decide in Open Questions: add the dep, or use core `effect/testing` + `vitest`. |
| Proposing a drifted/renamed API | High | Verify every symbol against `node_modules/effect` / `repos/effect`; `tsc` is the gate. |
| `lib/catalog.ts` / `app/page.tsx` edit collisions across parallel tasks | Low | Serialize the catalog/icon edits; build examples + pages in parallel. |
| Scope creep (a "whole map" instead of a focused guide) | Med | Keep field guides short; whole-maps are a separate, deliberate format. |

## Resolved Decisions (locked in)
1. **Scope:** build all six topics across the three phases.
2. **Testing tooling:** core `effect/testing` (`TestClock`/`TestConsole`/`TestSchema`) +
   plain `vitest`, with hand layer-swapping. **No** `@effect/vitest` dependency — Task 1's
   risk note is closed.
3. **Observability is a full lesson, not a field guide.** It becomes **Lesson 09** in the
   sequential path (Task 4), so `nextLesson` chains 05→06→07→08→09. The page lives at
   `app/backend/09-observability/page.tsx` with a numeral marker (no `ICONS` entry).

## Still open / out of scope
- Anything intentionally excluded? (CLI, frontend, deployment/runtime ops are not covered —
  not in this round unless requested.)

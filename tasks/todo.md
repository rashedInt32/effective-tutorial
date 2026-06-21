# Todo — missing topics

Each topic is one vertical slice: `examples/<area>/<slug>.ts` + `app/<area>/<slug>/page.tsx`
+ `lib/catalog.ts` entry + (field guides) `app/page.tsx` ICONS entry. Done = `pnpm test` +
`pnpm typecheck` + `pnpm build` green and the page renders in `pnpm dev`.

## Phase 1 — Close the learning-path holes
- [ ] **Task 1 · Lesson 06: Testing your backend** — swap a fake `UserRepo` Layer in a test; drive time with `TestClock`. (deps: 04, 05)
- [ ] **Task 2 · Guide: Time (DateTime · Duration · Clock)** — S; unblocks the TestClock story. (deps: none)
- [ ] **Checkpoint A** — guards green; 06 in the next-lesson chain; human review.

## Phase 2 — Core backend concerns
- [ ] **Task 3 · Lesson 07: Auth & middleware** — `HttpApiMiddleware` + `HttpApiSecurity`; show the 401 path. Invoke `security-and-hardening` first. (deps: httpapi)
- [ ] **Task 4 · Lesson 09: Observability** — narrative lesson: `Logger`, `Effect.withSpan`/`Tracer`, `Metric`. (deps: none)
- [ ] **Checkpoint B** — guards green; auth shows a rejected request; human review.

## Phase 3 — Performance & background work
- [ ] **Task 5 · Guide: Cache & batching** — `Cache`/`ScopedCache` + `RequestResolver` (the N+1 fix). (deps: 05)
- [ ] **Task 6 · Lesson 08: Background work & scheduling** — `FiberSet` + `Cron`; clean Scope shutdown. (deps: schedule, scope)
- [ ] **Checkpoint C** — all guards green; all new cards reachable from home; final review.

## Decisions (locked in)
- [x] **Scope:** build all 6 topics across the 3 phases.
- [x] **Testing tooling:** core `effect/testing` (`TestClock`/`TestConsole`) + plain `vitest`, hand layer-swapping — **no** `@effect/vitest` dep.
- [x] **Observability:** a full **Lesson 09** (sequential path), not a field guide.

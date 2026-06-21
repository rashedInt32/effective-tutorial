# Todo — Effect-core field guides

Each = one vertical slice: `examples/reference/<slug>.ts` + `app/reference/<slug>/page.tsx`
+ `lib/catalog.ts` entry + `app/page.tsx` ICONS entry. Done = typecheck + test + build green
and the card renders in `pnpm dev`.

## Phase 1
- [ ] **Task 1 · `schema`** — Schema: the whole map (Struct, Class, filter, transform, brand, Union)
- [ ] **Checkpoint A** — guards green; human review of depth

## Phase 2
- [ ] **Task 2 · `coordination`** — Semaphore, Deferred, Latch, Pool
- [ ] **Task 3 · `pubsub`** — PubSub broadcast (sibling of Queue)
- [ ] **Checkpoint B** — guards green; human review

## Phase 3
- [ ] **Task 4 · `stm`** — Tx* transactional state (atomic transactions)
- [ ] **Task 5 · `collections`** — Chunk, HashMap, HashSet
- [ ] **Task 6 · `random`** — deterministic, testable randomness
- [ ] **Checkpoint C** — full verify + browser check + PR

# Todo — the frontend half

Five lessons under `/frontend`, each a vertical slice: a typechecked
`examples/frontend/<slug>.ts` carved into `#region`s + `app/frontend/<slug>/page.tsx` +
a live demo in `app/frontend/_demos/` + a `lib/catalog.ts` entry + an `ICONS` entry.

Done = `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` green, the page renders in
`pnpm dev`, and the demo actually works when clicked.

Full reasoning in `frontend-plan.md`.

## Task 0 — infrastructure (blocking)
- [ ] `pnpm add @effect/atom-react@4.0.0-rc.112`; check `scheduler` lands in peer range
- [ ] Throwaway spike: one atom + `useAtomValue` on a scratch route
- [ ] **Confirm the page still builds static** — stop here if it does not
- [ ] `lib/catalog.ts`: `frontendData`, `FrontendSlug`, `frontendLessons`, per-track `nextLesson`
- [ ] `lib/catalog.test.ts`: cover `app/frontend` routes
- [ ] `app/frontend/layout.tsx` mirroring the backend layout
- [ ] `app/page.tsx`: Frontend card group + `ICONS`
- [ ] `app/frontend/_demos/Demo.tsx`: shared shell (chrome, label, reset)
- [ ] Verify a plain-value `Atom.make` overload exists for lesson 10
- [ ] **Checkpoint A** — guards green, page count unchanged, scratch page static, review `<Demo>`

## Task 1 — Lesson 10 · state in the browser
- [ ] `examples/frontend/10-state-in-the-browser.ts` — registry, `make`, `writable`, hooks
- [ ] Page + demo: counter, plus a second component reading the same atom
- [ ] Catalog + icon entry

## Task 2 — Lesson 11 · async state
- [ ] `examples/frontend/11-async-state.ts` — `Atom.make(effect)`, `AsyncResult`, `useAtomRefresh`
- [ ] Page + demo: stale rows stay visible while `waiting`
- [ ] Cross-link the Exit & Cause guide on the failure branch
- [ ] **Checkpoint B** — guards green; is `AsyncResult` clear without prior `Cause` knowledge?

## Task 3 — Lesson 12 · services in the browser
- [ ] `examples/frontend/12-services-in-the-browser.ts` — `Atom.runtime(Layer)`
- [ ] Page + demo: toggle a healthy vs failing layer
- [ ] Explicit callback to backend lesson 04

## Task 4 — Lesson 13 · one contract, both ends  ← the thesis
- [ ] `examples/frontend/13-one-contract-both-ends.ts` — `AtomHttpApi` over lesson 07's contract
- [ ] Query atoms, mutation atoms, invalidation by reactivity key
- [ ] Page + demo: list + add, mutation refreshes the list
- [ ] Read `AtomHttpApi` source properly; verify every option name
- [ ] **Checkpoint C** — guards green; extra review pass on this one

## Task 5 — Lesson 14 · rendering in Next.js
- [ ] `examples/frontend/14-rendering-in-nextjs.ts` — suspense, `initialValues`, hydration
- [ ] Page + demo: SSR'd first paint, client takeover
- [ ] Verify Next claims against `node_modules/next/dist/docs/`

## Ship
- [ ] Remove the Task 0 scratch route
- [ ] Browser pass over all five lessons
- [ ] Revisit the home hero's "(then frontend)" phrasing
- [ ] **Checkpoint D** — full verify + PR

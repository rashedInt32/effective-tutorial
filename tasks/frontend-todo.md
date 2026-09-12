# Todo — the frontend half  ✅ shipped

Five lessons under `/frontend`, each a vertical slice: a typechecked
`examples/frontend/<slug>.ts` carved into `#region`s + `app/frontend/<slug>/page.tsx` +
a live demo in `app/frontend/_demos/` + a `lib/catalog.ts` entry + an `ICONS` entry.

Done = `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` green, the page renders in
`pnpm dev`, and the demo actually works when clicked.

Full reasoning in `frontend-plan.md`.

## Task 0 — infrastructure (blocking)
- [x] `pnpm add @effect/atom-react@4.0.0-rc.112`; check `scheduler` lands in peer range
- [x] Throwaway spike: one atom + `useAtomValue` on a scratch route
- [x] **Confirm the page still builds static** — stop here if it does not
- [x] `lib/catalog.ts`: `frontendData`, `FrontendSlug`, `frontendLessons`, per-track `nextLesson`
- [x] `lib/catalog.test.ts`: cover `app/frontend` routes
- [x] `app/frontend/layout.tsx` mirroring the backend layout
- [x] `app/page.tsx`: Frontend card group + `ICONS`
- [x] `app/frontend/_demos/Demo.tsx`: shared shell (chrome, label, reset)
- [x] Verify a plain-value `Atom.make` overload exists for lesson 10
- [x] **Checkpoint A** — guards green, page count unchanged, scratch page static, review `<Demo>`

## Task 1 — Lesson 10 · state in the browser
- [x] `examples/frontend/10-state-in-the-browser.ts` — registry, `make`, `writable`, hooks
- [x] Page + demo: counter, plus a second component reading the same atom
- [x] Catalog + icon entry

## Task 2 — Lesson 11 · async state
- [x] `examples/frontend/11-async-state.ts` — `Atom.make(effect)`, `AsyncResult`, `useAtomRefresh`
- [x] Page + demo: stale rows stay visible while `waiting`
- [x] Cross-link the Exit & Cause guide on the failure branch
- [x] **Checkpoint B** — guards green; is `AsyncResult` clear without prior `Cause` knowledge?

## Task 3 — Lesson 12 · services in the browser
- [x] `examples/frontend/12-services-in-the-browser.ts` — `Atom.runtime(Layer)`
- [x] Page + demo: toggle a healthy vs failing layer
- [x] Explicit callback to backend lesson 04

## Task 4 — Lesson 13 · one contract, both ends  ← the thesis
- [x] `examples/frontend/13-one-contract-both-ends.ts` — `AtomHttpApi` over lesson 07's contract
- [x] Query atoms, mutation atoms, invalidation by reactivity key
- [x] Page + demo: list + add, mutation refreshes the list
- [x] Read `AtomHttpApi` source properly; verify every option name
- [x] **Checkpoint C** — guards green; extra review pass on this one

## Task 5 — Lesson 14 · rendering in Next.js
- [x] `examples/frontend/14-rendering-in-nextjs.ts` — suspense, `initialValues`, hydration
- [x] Page + demo: SSR'd first paint, client takeover
- [x] Verify Next claims against `node_modules/next/dist/docs/`

## Ship
- [x] Remove the Task 0 scratch route
- [x] Browser pass over all five lessons
- [x] Revisit the home hero's "(then frontend)" phrasing
- [x] **Checkpoint D** — full verify + PR

## Outcome notes

- The per-widget provider held up: all 40 routes still build `○ (Static)`.
- Lesson 14's first draft claimed the server renders the loading state into the
  HTML, and that seeding stops the Effect re-running. Both were false against a
  real production build — Next awaits the Suspense boundary while prerendering,
  and a seeded registry still runs its Effect. The lesson now teaches only the
  verified difference: a seeded registry has its value on the first render.
- Deferred as planned: forms with Schema validation, `Atom.optimistic`,
  `AtomRpc`, `Atom.searchParam`, and the Solid/Vue bindings.

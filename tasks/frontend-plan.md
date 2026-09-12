# Implementation Plan: the frontend half

## Overview

The home page promises "A backend (then frontend) built one real question at a time." The
backend half is done — nine lessons, three whole maps, twenty field guides. Nothing frontend
exists. This plan builds that second track: **five lessons** under `/frontend`, each with a
**live demo** where atoms really run in the browser against mock data.

The arc is deliberately the mirror of the backend's. Lesson 04 taught "ask for a service,
build it with a Layer, swap it in a test." The frontend lessons reuse that exact idea in the
browser, and land on the payoff the whole site has been building toward: **one `HttpApi`
contract, consumed on both ends, with no codegen and no duplicated types.**

All APIs verified against the installed `effect@4.0.0-rc.112` and `repos/effect`, never the
drifted `~/.local/share` clone.

## The library this rests on

Effect v4 ships reactive state in core, plus framework bindings as separate packages.

| Piece | Where | What it gives us |
|---|---|---|
| `Atom` | `effect/unstable/reactivity/Atom` | reactive values; `make`, `writable`, `fn`, `family`, `runtime`, `optimistic`, `swr` |
| `AsyncResult` | `effect/unstable/reactivity/AsyncResult` | initial / success / failure **plus a `waiting` flag** — stale-while-revalidating for free |
| `AtomHttpApi` | `effect/unstable/reactivity/AtomHttpApi` | turns an `HttpApi` contract into query + mutation atoms |
| `Hydration` | `effect/unstable/reactivity/Hydration` | `dehydrate` / `hydrate` for SSR |
| `@effect/atom-react` | separate package, **`4.0.0-rc.112`** | `RegistryProvider`, `useAtomValue`, `useAtom`, `useAtomSet`, `useAtomRefresh`, `useAtomSuspense`, `HydrationBoundary` |

**Version compatibility is already confirmed.** `@effect/atom-react@4.0.0-rc.112` declares
`effect: ^4.0.0-rc.112` (we have exactly that) and `react: >=19.0.0 <20.0.0` (we have
19.2.4). It is installable today, no version negotiation needed.

## Architecture decisions

- **A third track, not more backend lessons.** Frontend lessons get their own
  `frontendData` array in `lib/catalog.ts`, their own `app/frontend/` route segment, and their
  own card group on the home page. They continue the numbering (10–14) so the reading order
  stays obvious, but `nextLesson` walks each track separately so the backend chain still
  terminates at 09.
- **The demo provider is per-widget, never at the root.** Wrapping `app/layout.tsx` in
  `RegistryProvider` would turn all 36 pages into client-rendered ones. Instead each demo is a
  self-contained client component that mounts its own provider. Pages stay static; only the
  widget hydrates. This is the single most important constraint in the plan.
- **Demos use mock effects, not the network.** `Effect.sleep` plus in-memory data gives us
  real `waiting` states, real failures, and real retries with no API route and no server. The
  site remains statically exportable.
- **One shared `<Demo>` shell.** Window chrome matching `CodeFrame`, a label, and a reset
  control. Every lesson's widget renders inside it, so the demos read as one system rather
  than five bespoke toys.
- **Snippets stay file-backed.** Same rule as the backend: the code shown is lifted from a
  typechecked `examples/frontend/<slug>.ts` via `#region`, so a broken example fails the
  build. Demo components live under `app/frontend/_demos/` and are *separate* from the
  snippets — a demo needs JSX and state wiring that would only clutter the teaching code.

## Lessons

| # | Slug | Question it answers | Live demo |
|---|---|---|---|
| 10 | `10-state-in-the-browser` | How do I hold state Effect-style in React? | counter; two components share one atom |
| 11 | `11-async-state` | How do I load data without a loading-flag mess? | list loads, refresh keeps stale rows visible while `waiting` |
| 12 | `12-services-in-the-browser` | How do I use a service and swap it out? | toggle a healthy vs failing API layer, watch error state |
| 13 | `13-one-contract-both-ends` | How do I call my typed API without redeclaring types? | list + add, mutation invalidates the query |
| 14 | `14-rendering-in-nextjs` | How do I server-render this and hydrate? | SSR'd first paint, then client takeover |

### Why this order

Each lesson removes one thing the reader would otherwise have to hand-roll.

- **10** introduces the registry and the read/write split. Plain values only — no async yet,
  so the mental model lands before `AsyncResult` complicates it.
- **11** is the lesson that justifies the library. `Atom.make(effect)` yields
  `Atom<AsyncResult<A, E>>`, and the `waiting` flag is what makes "show stale data while
  refetching" a property of the type instead of a bug you fix later.
- **12** is the callback to lesson 04. `Atom.runtime(Layer)` lets atoms ask for services, so
  the swap-a-Layer trick that made the backend testable now makes the UI demoable.
- **13** is the capstone and the reason the site exists. The `HttpApi` from lesson 07 becomes
  query and mutation atoms through `AtomHttpApi`, with mutations invalidating queries by
  reactivity key. Same schema, both ends.
- **14** is the Next.js reality check: `useAtomSuspense`, `RegistryProvider` `initialValues`,
  and `Hydration` so the first paint is server-rendered.

## Dependency graph

```
Task 0 — infrastructure (install, catalog track, <Demo> shell, spike)
    │
    ├── 10 · state-in-the-browser ......... needs Task 0 only
    │       │
    │       └── 11 · async-state .......... needs 10 (registry + hooks established)
    │               │
    │               ├── 12 · services ..... needs 11 (AsyncResult) + backend lesson 04
    │               │       │
    │               │       └── 13 · one-contract ... needs 12 + backend 07/httpapi-reference
    │               │
    │               └── 14 · nextjs ....... needs 11; independent of 12/13
```

Lessons 10 → 13 are a chain; 14 can be built in parallel with 12 once 11 lands.

## Task list

### Task 0 — infrastructure (blocking)

Do this first and review it before writing lesson prose; everything else depends on the
shape it establishes.

- `pnpm add @effect/atom-react@4.0.0-rc.112`, then confirm `scheduler` resolves inside the
  peer range (`>=0.25.0 <0.28.0`; React 19 ships its own).
- **Spike, throwaway:** one atom, one `useAtomValue`, rendered in a client component on a
  scratch route. Confirm it typechecks, that `pnpm build` still reports the page as static,
  and that nothing in the existing 36 pages regresses. If the provider forces the page
  dynamic, stop and reconsider before writing five lessons on the assumption.
- `lib/catalog.ts`: add `frontendData`, `FrontendSlug`, `frontendLessons`, and extend
  `nextLesson` to walk the frontend chain independently.
- `lib/catalog.test.ts`: extend the route ↔ catalog tests to cover `app/frontend`.
- `app/frontend/layout.tsx` mirroring `app/backend/layout.tsx`.
- `app/page.tsx`: a "Frontend" card group plus `ICONS` entries.
- `app/frontend/_demos/Demo.tsx`: the shared shell — chrome, label, reset.
- Verify `Atom.make` accepts a plain (non-effect) value for lesson 10; if it does not, find
  the right constructor before the lesson claims one.

### Checkpoint A
`pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` green, page count still 36 + the
scratch route, and the scratch page reported static. Human review of the `<Demo>` look before
proceeding.

### Task 1 — Lesson 10 · state in the browser
Registry, `Atom.make`, `Atom.writable`, `useAtomValue` / `useAtom` / `useAtomSet`. Demo: a
counter plus a second component reading the same atom, to show the value is shared and not
prop-drilled.

### Task 2 — Lesson 11 · async state
`Atom.make(effect)` → `Atom<AsyncResult<A, E>>`; `AsyncResult.match` and
`matchWithWaiting`; `useAtomRefresh`; `initialValue`. Demo: a list that keeps showing stale
rows while a refresh is in flight, with the `waiting` dot visible.

### Checkpoint B
Guards green. Human review: is the `AsyncResult` explanation clear without the reader knowing
`Cause`? Cross-link the new Exit & Cause guide where the failure side comes up.

### Task 3 — Lesson 12 · services in the browser
`Atom.runtime(Layer)`, atoms that ask for a service, and swapping the layer. Demo: a toggle
between a working and a failing `ApiClient` layer so the error branch is something the reader
can trigger. Explicit callback to lesson 04.

### Task 4 — Lesson 13 · one contract, both ends
`AtomHttpApi` over the `HttpApi` contract from lesson 07. Query atoms, mutation atoms, and
invalidation by reactivity key. Demo: list + add where the mutation refreshes the list. This
is the site's thesis, so it gets the most care.

### Checkpoint C
Guards green. Human review of the capstone specifically — if any lesson earns extra polish
it is this one.

### Task 5 — Lesson 14 · rendering in Next.js
`useAtomSuspense`, `RegistryProvider` `initialValues`, `Hydration.dehydrate` / `hydrate`,
`HydrationBoundary`. Demo: a server-rendered initial value the client then takes over.
Verify claims against `node_modules/next/dist/docs/`, not recall.

### Checkpoint D — ship
Full verify, remove the scratch route from Task 0, browser pass over all five lessons in
`pnpm dev`, update the home hero if the "(then frontend)" phrasing should now read as
delivered, then PR.

## Risks

- **`@effect/atom-react` is a release candidate.** Its API can move between rc versions, the
  same caveat the `unstable/` HTTP modules already carry. Pin the exact version and say so on
  the pages, as lesson 01 does.
- **Static rendering is the thing most likely to break.** A misplaced provider silently turns
  pages dynamic. Task 0's spike exists to catch that before five lessons depend on it.
- **`AtomHttpApi` is the least-documented piece.** Budget real source-reading time for
  Task 4, and verify the query/mutation option names rather than assuming them.
- **Demo scope creep.** Five widgets can quietly become a small app. Each demo should fit on
  one screen and illustrate exactly one idea; anything more belongs in prose.

## Out of scope

Deliberately left for later, to keep this to five lessons: forms and validation with Schema,
optimistic updates (`Atom.optimistic`), `AtomRpc`, `Atom.searchParam` for URL state, and
Solid/Vue bindings. Each is a natural follow-up lesson once the core arc is published.

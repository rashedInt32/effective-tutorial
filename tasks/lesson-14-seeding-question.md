# Open question: what does `initialValues` actually prevent?

Picked up tomorrow. Nothing in the shipped site depends on the answer — Lesson 14
was rewritten to claim only what was measured — but the question is real and the
lesson could say more once it's settled.

## What I observed

While building Lesson 14 I added a module-level counter, incremented inside the
atom's Effect, and rendered the total in the demo:

```ts
let clientRuns = 0
const fetchTodos = Effect.flatMap(
  Effect.sync(() => { clientRuns += 1 }),
  () => Effect.delay(Effect.succeed([...]), "1200 millis")
)
```

The demo renders two `RegistryProvider`s over the **same** atom — one bare, one
seeded with `initialValues={[[todosAtom, AsyncResult.success(serverTodos)]]}`.

Measured against a production build (`pnpm build` + `pnpm start`, port 3100):

| moment | counter |
|---|---|
| after initial page load | 3 |
| after one demo reset | 5 |

So it climbs by **2 per reset** — one per registry. The seeded registry runs its
Effect too. And 3 on first load is one more than the two registries mounting,
which I never accounted for.

## The two claims this killed

1. *"The server renders your loading state into the HTML."* False here. Next
   awaits the Suspense boundary while prerendering, so the shipped HTML is
   complete. Verified: `.next/server/app/frontend/14-rendering-in-nextjs.html`
   contains the rows and **zero** occurrences of the fallback text.
2. *"Seeding means the Effect never runs a second time."* False, per the counter
   above.

## What the lesson says now

Only the difference that reproduces every time: a seeded registry has its value
on the first render and never falls back; a bare one shows its skeleton while
loading. Confirmed by clicking reset and sampling the DOM at 150 ms — the bare
panel reads `loading… (suspended)` while the seeded one already lists the rows.

There's a callout stating plainly that seeding concerns the first render and is
not a promise about when the Effect runs.

## To investigate

1. **Why does a seeded atom still run?** Read `AtomRegistry.make`'s
   `initialValues` handling in
   `repos/effect/packages/effect/src/unstable/reactivity/AtomRegistry.ts`, and
   how `Atom.make(effect)` nodes decide to (re)compute on first subscribe. Is the
   seeded value treated as an initial value that a subscription then refreshes
   past?
2. **Why 3 and not 2 on first load?** Candidates: the RSC payload causing a
   second client render, a Suspense retry after hydration, or the counter being
   incremented during the server pass and shipped in the bundle's module state.
   Rule each out rather than guess.
3. **Is there an API that does prevent the re-run?** Check
   `Atom.withServerValue`, `withServerValueInitial`, `Atom.setIdleTTL`, and a
   query's `timeToLive`. `withServerValueInitial` looked closest when skimming.
4. **Then decide** whether Lesson 14 gains a short section on it, or whether the
   current callout is already the honest ceiling. Do not add a claim that can't
   be reproduced from a clean build twice.

## Guardrail

The reason this file exists is that both wrong claims typechecked, built, and
looked convincing on screen. Only `pnpm build` plus a real browser caught them.
Whatever the answer turns out to be, verify it against a production build, not a
dev server and not the types.

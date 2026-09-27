# Resolved: what `initialValues` actually prevents

Settled 2026-09-27. Lesson 14 now has a Q5 section carrying the answer; the old
"reach for `Atom.withServerValue`" callout was wrong and is gone.

## The answer

`initialValues` prevents the **fallback**, not the **fetch**.

- `RegistryProvider initialValues` → `AtomRegistry` constructor →
  `node.setInitialValue(value)`. That sets `NodeState.stale` (initialized +
  waitingForValue) and `preserveInitialValueOnBuild = true`. The first `value()`
  read still calls `atom.read`, which starts the Effect; the seed is kept as the
  visible value until the Effect's result replaces it via `setSelf`.
  Stale-while-revalidate, by design.
- `useAtomInitialValues` (hook, `@effect/atom-react`) →
  `registry.ensureNode(atom).setValue(value)`. That sets `NodeState.valid`, so
  `value()` never builds and the Effect does not run until something
  invalidates the atom.
- `Hydration.hydrate` / `setSerializable` also lands in `setValue` for the
  target atom, so a hydrated tree does not refetch either.
- `Atom.withServerValue` / `withServerValueInitial` only change what
  `useSyncExternalStore`'s `getServerSnapshot` returns. Unrelated to re-runs.

Source: `repos/effect/packages/effect/src/unstable/reactivity/AtomRegistry.ts`
(`setInitialValue`, `setValue`, `NodeImpl.value`), `Atom.ts` (`makeEffect`,
`withServerValue`), `node_modules/@effect/atom-react/dist/Hooks.js`.

## Why the counter read 3, not 2

Not reproduced as 3. A six-panel probe page, each panel its own atom and
counter, gave the same numbers on two clean production builds:

| panel | first load (hydration) | each reset |
|---|---|---|
| bare + `useAtomSuspense` | 1 | 1 |
| bare + `useAtomValue` | **2** | 1 |
| bare + `useAtomValue` + `Atom.keepAlive` | 1 | 1 |
| `initialValues` + `useAtomSuspense` | 1 | 1 |
| `useAtomInitialValues` + `useAtomSuspense` | **1** | 0 |
| `useAtomInitialValues` + `Atom.keepAlive` | 0 | 0 |

The extra first-load runs come from the registry's node sweep. `createNode`
schedules `scheduleAtomRemoval` for any non-keepAlive atom. During hydration
the node is created in render (`getServerSnapshot` → `registry.get`, or the
hook's `ensureNode`) with no subscriber, the sweep fires before React's
`useSyncExternalStore` subscribes after commit, and the subscribe rebuilds the
node from scratch. `Atom.keepAlive` removes the run in both affected rows, which
is what confirms the cause. The suspense path is not affected because the
thrown promise keeps a subscription on the node.

The original demo's shared counter probably picked up one such extra run; the
two-panel configuration it used measures 2 on the probe.

## Guardrail, kept

Both wrong claims typechecked, built, and looked right. Only `pnpm build` plus
a real browser caught them. The Q5 callout says so, and any change to how the
lesson seeds should be re-counted on a production build.

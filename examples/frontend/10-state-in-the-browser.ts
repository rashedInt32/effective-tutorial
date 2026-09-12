import { Atom } from "effect/unstable/reactivity"

// The backend half kept every value inside an Effect. On the client you need
// something else: state that OUTLIVES a single computation and that React can
// subscribe to. That's an `Atom` — one reactive value, declared at module level,
// read and written from any component without prop-drilling or a context.

// #region make
// An Atom holding a plain value. Declared OUTSIDE any component, so it isn't
// recreated on every render — the atom is the identity of the state, and
// components just subscribe to it.
export const countAtom = Atom.make(0)

// Atoms are values, so nothing has happened yet. No store, no provider call,
// no reducer — this is a declaration, like every Effect in the backend lessons.
// #endregion make

// #region derived
// Read another atom with `get` and you have a DERIVED atom: recomputed when its
// input changes, and read-only, because its value is a function of the source.
export const doubledAtom = Atom.make((get) => get(countAtom) * 2)

// Derive from as many as you like. Effect's dependency tracking is the same idea
// as a service requirement — you ask for what you need and it's wired for you.
export const labelAtom = Atom.make((get) =>
  `${get(countAtom)} doubled is ${get(doubledAtom)}`
)
// #endregion derived

// #region writable
// `Atom.writable` splits reading from writing, which is how you keep an
// invariant in one place. Here the count can never go below zero, whatever a
// component tries to set.
export const clampedAtom = Atom.writable(
  (get) => get(countAtom),
  (ctx, value: number) => ctx.set(countAtom, Math.max(0, value))
)
// #endregion writable

// #region hooks
// In a component, three hooks cover almost everything:
//
//   const count = useAtomValue(countAtom)       // subscribe, re-render on change
//   const [count, setCount] = useAtom(countAtom) // read AND write
//   const setCount = useAtomSet(countAtom)       // write only — no re-render
//
// `useAtomSet` matters more than it looks: a component that only writes doesn't
// subscribe, so clicking a button doesn't re-render the thing that owns it.
// #endregion hooks

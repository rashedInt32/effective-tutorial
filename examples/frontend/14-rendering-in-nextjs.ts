import { Effect, Schema } from "effect"
import { Atom, AsyncResult } from "effect/unstable/reactivity"

// The atoms from Lessons 10–13 all start EMPTY and fill in on the client. That's
// fine for a dashboard behind a login, and wrong for a page you want indexed or
// fast on first paint. This lesson closes that gap: render on the server, then
// hand the same atoms to the client with their values already in place.

// #region problem
// An async atom starts EMPTY in whichever registry reads it. Next awaits a
// Suspense boundary while prerendering, so the HTML it ships is usually
// complete — but the browser builds its own registry from scratch, and an atom
// with nothing in it has nothing to render. So the first client render of a
// fresh registry falls back, and the Effect runs here too, for data the page
// already contained.
//
// On a client-side navigation there's no server render at all, so the fallback
// is all the user sees until the request lands.
type TodoRow = { readonly id: number; readonly title: string; readonly done: boolean }

const fetchTodos: Effect.Effect<ReadonlyArray<TodoRow>> = Effect.succeed([
  { id: 1, title: "Ship it", done: false }
])

export const todosAtom = Atom.make(fetchTodos)
// prerendered HTML: complete.  fresh browser registry: empty -> falls back.
// #endregion problem

// #region initial-values
// The fix is to SEED the registry. `RegistryProvider` takes `initialValues`:
// pairs of an atom and the value it should already have. A Server Component
// fetches the data, passes it down as a prop, and the registry starts out
// holding it — so the FIRST render is the finished list, with no fallback.
//
//   // page.tsx — a Server Component
//   const todos = await loadTodos()
//   return <TodoList serverTodos={todos} />
//
//   // TodoList.tsx — "use client"
//   <RegistryProvider initialValues={[[todosAtom, AsyncResult.success(todos)]]}>
//     <Todos />
//   </RegistryProvider>
//
// `AsyncResult.success` is how you spell "already loaded" by hand.
export const seeded = (todos: ReadonlyArray<TodoRow>) => AsyncResult.success(todos)
// #endregion initial-values

// #region suspense
// `useAtomSuspense` reads an atom and SUSPENDS while it's initial, so React
// renders the nearest `<Suspense fallback>` instead of you writing a loading
// branch. It returns the Success directly — no match, no undefined.
//
//   function Todos() {
//     const { value } = useAtomSuspense(todosAtom)  // AsyncResult.Success
//     return <ul>{value.map(...)}</ul>
//   }
//
//   <Suspense fallback={<Skeleton />}>
//     <Todos />
//   </Suspense>
//
// A failure THROWS by default, so an error boundary catches it. Pass
// `{ includeFailure: true }` to handle it in the component instead.
// #endregion suspense

// #region serializable
// For a full dehydrate/hydrate round trip the atom needs a key and a schema, so
// its value can survive as JSON between the server and the browser.
const Todo = Schema.Struct({
  id: Schema.Number,
  title: Schema.String,
  done: Schema.Boolean
})

export const serializableTodos = Atom.make(fetchTodos).pipe(
  Atom.serializable({
    key: "todos",
    schema: AsyncResult.Schema({ success: Schema.Array(Todo), error: Schema.Never })
  })
)
// #endregion serializable

// #region hydrate
// Then the pair: `Hydration.dehydrate(registry)` on the server produces plain
// data, and `<HydrationBoundary state={...}>` puts it back on the client.
//
//   // server
//   const state = Hydration.dehydrate(registry)
//
//   // client
//   <HydrationBoundary state={state}>
//     <Todos />
//   </HydrationBoundary>
//
// Use `initialValues` when you know which atoms to seed — it's simpler. Reach
// for dehydrate/hydrate when a whole tree of atoms should cross the boundary at
// once, keyed rather than enumerated.
// #endregion hydrate

// #region seed-and-refetch
// Seeding is about the FIRST render. It is not a promise that the Effect never
// runs. `initialValues` stores the seed as a STALE value: the first read shows
// it and still starts the Effect, whose result then replaces it. That is
// stale-while-revalidate, by design — the seeded panel above runs its Effect
// once per mount, exactly like the bare one.
//
// To seed AND skip the fetch, seed from inside the tree. `useAtomInitialValues`
// writes the value as VALID, so nothing runs until something invalidates it:
//
//   function Todos({ serverTodos }) {
//     useAtomInitialValues([[todosAtom, AsyncResult.success(serverTodos)]])
//     const { value } = useAtomSuspense(todosAtom)
//     return <ul>{value.map(...)}</ul>
//   }
//
// One catch, and only while hydrating: a node created during render has no
// subscriber yet, and the registry drops unsubscribed nodes on its next tick.
// React subscribes after commit, finds the node gone, rebuilds it — and that
// rebuild runs the Effect once. `Atom.keepAlive` opts the atom out of the drop.
export const todosAtomKeepAlive = Atom.keepAlive(todosAtom)

// Measured on a production build, runs of the atom's Effect:
//                      initialValues   useAtomInitialValues   …+ keepAlive
//   first load (SSR)         1                  1                  0
//   each remount             1                  0                  0
// #endregion seed-and-refetch

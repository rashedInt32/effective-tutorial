import { Data, Effect } from "effect"
import { Atom, AsyncResult } from "effect/unstable/reactivity"

// Loading data is where client state usually turns ugly: an `isLoading` boolean,
// an `error` slot, a `data` slot, and four impossible combinations of the three.
// `Atom.make` over an Effect replaces all of it with ONE value — an
// `AsyncResult` that can only be in a state that actually exists.

// #region atom
// Give `Atom.make` an Effect instead of a value and you get back an
// `Atom<AsyncResult<A, E>>`. The Effect runs when something first subscribes,
// not when the module loads — same laziness as every Effect in the backend half.
class Offline extends Data.TaggedError("Offline")<{ attempt: number }> {}

const fetchUsers = Effect.gen(function* () {
  yield* Effect.sleep("600 millis") // pretend it's a network
  return ["Ada Lovelace", "Grace Hopper", "Barbara Liskov"]
})

export const usersAtom = Atom.make(fetchUsers)
// Atom<AsyncResult<Array<string>, never>>
// #endregion atom

// #region states
// An `AsyncResult` is one of three things, and `match` makes the compiler check
// that you handled each: nothing yet, a failure, or a value.
export const describe = (result: AsyncResult.AsyncResult<Array<string>, Offline>) =>
  AsyncResult.match(result, {
    onInitial: () => "nothing yet",
    onFailure: (failure) => `failed: ${failure.cause}`,
    onSuccess: (success) => `${success.value.length} users`
  })
// #endregion states

// #region waiting
// The part that earns the library: `waiting` is a FLAG, not a state. A refresh
// is `waiting` while STILL holding the previous value — so you render the old
// rows greyed out instead of flashing an empty spinner. That's what the four
// impossible boolean combinations were always trying to express.
export const rows = (result: AsyncResult.AsyncResult<Array<string>, Offline>) => ({
  // `value` looks through a failure to the last success, so data survives a
  // failed refresh too.
  data: AsyncResult.getOrElse(result, () => [] as Array<string>),
  isStale: result.waiting && AsyncResult.isSuccess(result)
})
// #endregion waiting

// #region failure
// Failures work the same way. The Effect's error channel becomes the
// AsyncResult's `E`, so a typed failure stays typed all the way into the view.
let attempt = 0

const flaky = Effect.gen(function* () {
  yield* Effect.sleep("400 millis")
  attempt += 1
  if (attempt % 2 === 1) return yield* new Offline({ attempt })
  return ["Ada Lovelace"]
})

export const flakyAtom = Atom.make(flaky)
// Atom<AsyncResult<Array<string>, Offline>>
// #endregion failure

// #region refresh
// `useAtomRefresh(atom)` hands a component a function that re-runs the Effect.
// The atom keeps its current value while the new one is in flight:
//
//   const refresh = useAtomRefresh(usersAtom)
//   <button onClick={refresh}>refresh</button>
//
// No cache keys, no invalidation call — refreshing is a property of the atom.
// #endregion refresh

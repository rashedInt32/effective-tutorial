import { Duration, Effect, Fiber } from "effect"

// Effect's concurrency is *structured*: forked work is tied to its parent's
// lifetime, so fibers never leak and interruption propagates automatically. You
// declare HOW MUCH runs at once; cancellation and cleanup come for free.

// #region all
// Run several effects together and collect their results. `concurrency` controls
// how many run at once — sequential by default, a number to cap it, or
// "unbounded" for all at once. Tuples in, a typed tuple out.
const fetchUser = (id: number) => Effect.succeed({ id, name: `user-${id}` })

export const pair = Effect.all([fetchUser(1), fetchUser(2)], {
  concurrency: "unbounded"
}) // Effect<[{ id; name }, { id; name }]>

export const everyone = Effect.forEach([1, 2, 3], fetchUser, {
  concurrency: 5
}) // Effect<Array<{ id; name }>>
// #endregion all

// #region race-timeout
// `race` returns whichever effect wins — the loser is interrupted. `timeout`
// gives up after a Duration, failing with a TimeoutError.
export const winner = Effect.race(
  fetchUser(1).pipe(Effect.delay(Duration.millis(50))),
  fetchUser(2).pipe(Effect.delay(Duration.millis(10)))
) // Effect<{ id; name }>

export const bounded = fetchUser(1).pipe(Effect.timeout(Duration.seconds(2)))
// Effect<{ id; name }, TimeoutError>
// #endregion race-timeout

// #region fork
// For a background fiber, `forkChild` starts one tied to the current fiber — note
// v4 has no plain `Effect.fork`. It hands back a handle: `Fiber.join` to await the
// result, `Fiber.interrupt` to cancel.
declare const longTask: Effect.Effect<number>

export const supervised = Effect.gen(function* () {
  const fiber = yield* Effect.forkChild(longTask)
  // ...do other work while it runs in the background...
  return yield* Fiber.join(fiber)
})
// #endregion fork

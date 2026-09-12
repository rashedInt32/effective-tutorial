import { Deferred, Effect, Fiber, Latch, Pool, Semaphore } from "effect"

// Four primitives for getting fibers to cooperate. A `Semaphore` limits how many
// run at once; a `Deferred` hands one value from one fiber to another; a `Latch`
// holds fibers at a gate until you open it; a `Pool` shares a fixed set of
// resources. All fiber-safe, all interruption-aware. Every region typechecks
// against effect@4 beta.

// #region semaphore
// A `Semaphore` is N permits. `withPermits(k)` takes k before running and gives
// them back after — so even with unbounded concurrency, at most N tasks touch the
// guarded section at once. The cure for "don't hammer this API with 1000 calls".
export const limited = Effect.gen(function* () {
  const sem = yield* Semaphore.make(2) // 2 permits
  yield* Effect.forEach(
    [1, 2, 3, 4, 5],
    (n) => sem.withPermits(1)(callApi(n)), // never more than 2 in flight
    { concurrency: "unbounded" }
  )
})

const callApi = (n: number) => Effect.as(Effect.sleep("10 millis"), n)
// #endregion semaphore

// #region deferred
// A `Deferred<A, E>` is a one-shot box: empty until someone completes it, then
// every awaiter gets that one result. It's the fiber-safe equivalent of a promise
// you resolve by hand — perfect for "wait until X is ready" handoffs between fibers.
export const handoff = Effect.gen(function* () {
  const signal = yield* Deferred.make<string>()
  const waiter = yield* Effect.forkChild(Deferred.await(signal)) // blocks until completed
  yield* Deferred.succeed(signal, "ready") // wakes the waiter with the value
  return yield* Fiber.join(waiter) // "ready"
})
// #endregion deferred

// #region latch
// A `Latch` is a gate. Fibers that `await` a closed latch park; `open` releases
// them all at once and lets future awaiters straight through. Use it to line work
// up and then start it together — a warmed-up worker pool, a synchronized kickoff.
export const gate = Effect.gen(function* () {
  const latch = yield* Latch.make(false) // start closed
  const workers = yield* Effect.forkChild(
    Effect.forEach([1, 2, 3], (n) => Effect.as(latch.await, n), {
      concurrency: "unbounded"
    })
  )
  yield* latch.open // every parked worker proceeds now
  return yield* Fiber.join(workers)
})
// #endregion latch

// #region pool
// A `Pool` shares a fixed set of expensive resources — database connections, say.
// `Pool.make` acquires `size` of them up front (each a scoped resource);
// `Pool.get` borrows one within a scope and returns it automatically when that
// scope closes. Callers never open or close a connection by hand.
interface Conn {
  readonly query: Effect.Effect<ReadonlyArray<string>>
  readonly close: Effect.Effect<void>
}
const openConn: Effect.Effect<Conn> = Effect.succeed({
  query: Effect.succeed(["row"]),
  close: Effect.void
})

export const pooled = Effect.scoped(
  Effect.gen(function* () {
    const pool = yield* Pool.make({
      acquire: Effect.acquireRelease(openConn, (c) => c.close), // scoped resource
      size: 5
    })
    // `use` borrows one for the duration of the callback, then returns it.
    // (`Pool.get` is the lower-level form: it borrows for the current scope.)
    return yield* Pool.use(pool, (conn) => conn.query)
  })
)
// #endregion pool

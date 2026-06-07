import { Data, Effect } from "effect"

// `Effect<A, E, R>` is a *description* of a program that may succeed with an A,
// fail with a typed E, and require services R. Nothing happens until you hand it
// to a runner — so you build, compose, and transform these descriptions freely,
// then run once at the edge of the app.

// #region create
// Lift values and side effects into Effect. `succeed`/`fail` never throw; `sync`
// wraps a synchronous thunk; `promise` wraps a non-failing async; `tryPromise`
// wraps one that can reject, mapping the rejection into a typed (tagged) error.
class FetchError extends Data.TaggedError("FetchError")<{ cause: unknown }> {}

export const ok = Effect.succeed(42) //                        Effect<number>
export const no = Effect.fail("nope" as const) //              Effect<never, "nope">
export const now = Effect.sync(() => Date.now()) //            Effect<number>
export const waited = Effect.promise(() => Promise.resolve(1)) // Effect<number>
export const fetched = Effect.tryPromise({
  try: () => fetch("https://example.com").then((r) => r.text()),
  catch: (cause) => new FetchError({ cause })
}) // Effect<string, FetchError>
// #endregion create

// #region sequence
// Two ways to chain, building the IDENTICAL Effect. `Effect.gen` reads like
// async/await — imperative, best once there are several steps. `pipe` composes
// with combinators — point-free, best for short flows. (A `yield*` is exactly a
// `flatMap`; that's all gen desugars to.)
export const viaGen = Effect.gen(function* () {
  const a = yield* Effect.succeed(2)
  const b = yield* Effect.succeed(3)
  return a + b
})

export const viaPipe = Effect.succeed(2).pipe(
  Effect.flatMap((a) => Effect.succeed(3).pipe(Effect.map((b) => a + b)))
)
// #endregion sequence

// #region transform
// The everyday combinators — same names you met on Option/Result. `map` changes
// a success, `flatMap` sequences another Effect, `tap` runs a side effect without
// touching the value, `as` replaces it.
export const transformed = Effect.succeed(10).pipe(
  Effect.map((n) => n + 1),
  Effect.tap((n) => Effect.log(`value is ${n}`)),
  Effect.flatMap((n) => Effect.succeed(n * 2)),
  Effect.as("done" as const)
) // Effect<"done">
// #endregion transform

// #region run
// At the edge of the app, hand a description to a runner. `runSync` for purely
// synchronous effects, `runPromise` for async, `runFork` for a background fiber
// you control. (Long-running servers use a platform runtime — NodeRuntime.runMain
// from Lesson 01 — which also wires up signals and error logging.)
export const sync = Effect.runSync(Effect.succeed(1)) //      number
export const asPromise = Effect.runPromise(Effect.succeed(2)) // Promise<number>
export const fiber = Effect.runFork(Effect.succeed(3)) //     Fiber<number>
// #endregion run

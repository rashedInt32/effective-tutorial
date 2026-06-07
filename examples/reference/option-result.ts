import { Effect, Option, Result } from "effect"

// Two everyday containers. `Option<A>` models a value that might be ABSENT;
// `Result<A, E>` models one that either SUCCEEDED with an A or FAILED with a
// typed E. In Effect v4 `Either` is renamed `Result` (Success/Failure instead of
// Right/Left). Both are plain values — you transform them with the same
// combinators, and only lift into an Effect when you actually want to run.

// #region option-construct
// `some` wraps a present value; `none()` is the absent case (a function call, not
// a value); `fromNullishOr` lifts a possibly null/undefined value (this is v4's
// rename of `fromNullable`).
export const present = Option.some(42)
export const absent = Option.none<number>()
export const fromEnv = Option.fromNullishOr(process.env.HOME) // Option<string>
// #endregion option-construct

// #region option-use
// The four you reach for daily: `map`/`flatMap` transform the value WHEN present,
// `filter` can drop it, and `getOrElse`/`match` collapse back to a plain value.
export const greeting = Option.some("ada").pipe(
  Option.map((name) => name.toUpperCase()),
  Option.filter((name) => name.length > 1),
  Option.getOrElse(() => "ANONYMOUS")
) // string
// #endregion option-use

// #region result-construct
// `succeed` is the success channel (the old Right); `fail` is the typed error
// channel (the old Left). The error type travels with the value: Result<number,
// string>.
export const ok = Result.succeed(42)
export const bad = Result.fail("not a number")
// #endregion result-construct

// #region result-use
// The SAME shape as Option — only now there are two sides. `map` transforms the
// success, `mapError` the failure, and `match` folds both into one value.
export const report = Result.succeed(7).pipe(
  Result.map((n) => n * 2),
  Result.mapError((e: string) => e.toUpperCase()),
  Result.match({
    onSuccess: (n) => `got ${n}`,
    onFailure: (e) => `error: ${e}`
  })
) // string
// #endregion result-use

// #region interop
// Option and Result are values, not Effects (no `yield*` directly). Lift them in
// when you need to run with other effects: a `None` becomes a NoSuchElementError,
// a `Failure` carries its error straight into the Effect's error channel.
export const program = Effect.gen(function* () {
  const x = yield* Effect.fromOption(present) //  Effect<number, NoSuchElementError>
  const y = yield* Effect.fromResult(ok) //       Effect<number, never>
  return x + y
})

// ...and back the other way — capture an Effect's outcome as a plain value.
export const asOption = Effect.option(program) // Effect<Option<number>>
export const asResult = Effect.result(program) // Effect<Result<number, NoSuchElementError>>
// #endregion interop

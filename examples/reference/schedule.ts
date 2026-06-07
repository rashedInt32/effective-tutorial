import { Duration, Effect, Schedule } from "effect"

// A `Schedule` is a reusable POLICY for repetition: when to recur, how long to
// wait between runs, and when to stop. You build one declaratively, then hand it
// to `Effect.retry` (re-run on failure) or `Effect.repeat` (re-run on success).

// #region build
// The building blocks: a fixed count, a constant gap, or growing backoff.
const upTo5 = Schedule.recurs(5) //                          at most 5 more times
const everySecond = Schedule.spaced(Duration.seconds(1)) //  1s between runs
const backoff = Schedule.exponential(Duration.millis(100)) // 100ms, 200, 400, ...
// #endregion build

// #region compose
// Policies compose. `jittered` spreads delays to avoid thundering herds; `both`
// keeps going only while BOTH policies would — the usual way to CAP an unbounded
// policy at N attempts.
const cappedBackoff = backoff.pipe(
  Schedule.jittered,
  Schedule.both(upTo5)
) // exponential + jitter, but at most 5 retries
// #endregion compose

// #region apply
// Feed a policy to `retry` (on failure) or `repeat` (on success). The same value
// works for both — a Schedule is just a description, like everything else.
declare const flaky: Effect.Effect<string, Error>

export const withRetry = flaky.pipe(Effect.retry(cappedBackoff))
export const polled = flaky.pipe(Effect.repeat(everySecond))
// #endregion apply

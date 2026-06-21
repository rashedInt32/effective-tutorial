import { Clock, DateTime, Duration, Effect } from "effect"

// Time in Effect is three small, immutable types. `Duration` is a length of
// time; `DateTime` is a point in time; `Clock` is the service that tells you
// what "now" is — read as an Effect, so a test can fake it. Every region
// typechecks against effect@4 beta.

// #region duration
// A `Duration` is an exact span — build it from a unit, and most APIs that take
// a delay also accept the shorthand string `"5 seconds"`. They combine and
// compare as values; `toMillis` drops to a number, `format` to a label.
export const fiveSeconds = Duration.seconds(5)
export const total = Duration.sum(Duration.minutes(2), Duration.millis(500))
export const longer = Duration.isGreaterThan(fiveSeconds, Duration.seconds(3)) // true
export const asMillis = Duration.toMillis(total) // 120500
export const label = Duration.format(total) // "2m 500ms"
// #endregion duration

// #region datetime
// A `DateTime` is an instant. `now` is an Effect (it reads the Clock), so it's
// testable; `makeUnsafe` builds one from parts/ISO/epoch. Math returns a NEW
// value — nothing mutates — and `formatIso` / `toParts` read it back out.
export const clockNow = DateTime.now // Effect<DateTime.Utc>

export const launch = DateTime.makeUnsafe("2026-01-01T00:00:00Z")
export const later = DateTime.add(launch, { days: 30, hours: 12 })
export const iso = DateTime.formatIso(later) // "2026-01-31T12:00:00.000Z"
export const year = DateTime.toParts(later).year // 2026
// #endregion datetime

// #region clock
// Why read the time through a service instead of `Date.now()`? Because the
// service is swappable. `Clock.currentTimeMillis` is itself an Effect; in
// production it reads the wall clock, under `TestClock` it reads the time you
// set — so the SAME code is deterministic in a test. `Date.now()` can't be.
export const elapsed = Effect.gen(function* () {
  const start = yield* Clock.currentTimeMillis
  yield* doWork
  const end = yield* Clock.currentTimeMillis
  return end - start
})

const doWork = Effect.void
// #endregion clock

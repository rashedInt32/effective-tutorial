import { Effect, Random } from "effect"

// Randomness in Effect is read from the `Random` SERVICE, not a global
// `Math.random()`. That one indirection is the whole point: in production it's a
// real PRNG, but a test can pin a seed and get the exact same sequence every run
// — the same testability story as `Clock`. Every region typechecks against
// effect@4 beta.

// #region draw
// Each draw is an Effect. `next` is a float in [0, 1); `nextIntBetween` is an
// inclusive integer range; `nextBoolean` flips a coin. Because they go through the
// service, they compose like any other effect and stay deterministic under a seed.
export const roll = Effect.gen(function* () {
  const fraction = yield* Random.next // [0, 1)
  const dice = yield* Random.nextIntBetween(1, 6) // 1..6 inclusive
  const coin = yield* Random.nextBoolean // true | false
  return { fraction, dice, coin }
})
// #endregion draw

// #region deterministic
// The payoff: `Random.withSeed` provides a seeded generator for the wrapped
// effect. Same seed → same sequence, every time — so a test asserting on random
// output is reproducible instead of flaky. Swap the service, not the code.
const program = Effect.gen(function* () {
  const a = yield* Random.nextIntBetween(1, 100)
  const b = yield* Random.nextIntBetween(1, 100)
  return [a, b] as const
})

export const seededRun = program.pipe(Random.withSeed("demo"))
// `seededRun` yields the SAME pair on every run — perfect for a deterministic test.
// #endregion deterministic

// #region shuffle
// `Random.shuffle` reorders any iterable through the same service — so a shuffled
// deck is reproducible under a seed too. Here: shuffle, then deal the top three.
export const deal = Effect.gen(function* () {
  const deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const shuffled = yield* Random.shuffle(deck)
  return shuffled.slice(0, 3)
}).pipe(Random.withSeed("table-7"))
// #endregion shuffle

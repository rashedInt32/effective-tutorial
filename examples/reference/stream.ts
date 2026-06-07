import { Effect, Stream } from "effect"

// A `Stream<A, E, R>` is a pull-based sequence of zero-or-more `A`s — think of it
// as an Effect that yields many results over time. It's lazy and resource-safe:
// nothing happens until you RUN it, and it flows one chunk at a time instead of
// loading everything into memory.

// #region build
// Build from explicit values, an iterable, a numeric range, or a single Effect.
export const fromValues = Stream.make(1, 2, 3) //              Stream<number>
export const fromList = Stream.fromIterable([1, 2, 3]) //      Stream<number>
export const counted = Stream.range(1, 100) //                 Stream<number>
export const fromOne = Stream.fromEffect(Effect.succeed(42)) // Stream<number>
// #endregion build

// #region transform
// The same combinators as Effect, applied to every element — lazily. `mapEffect`
// runs an Effect per element (with optional concurrency); `take` bounds the flow.
const double = (n: number) => Effect.succeed(n * 2)

export const pipeline = Stream.range(1, 1_000_000).pipe(
  Stream.filter((n) => n % 2 === 0),
  Stream.map((n) => n + 1),
  Stream.mapEffect(double, { concurrency: 4 }),
  Stream.take(10)
) // Stream<number> — only ten elements are ever pulled
// #endregion transform

// #region run
// Nothing runs until you drive the stream into an Effect. `runCollect` gathers
// every element into an array, `runForEach` performs an effect per element, and
// `runDrain` runs purely for the side effects.
export const collected = Stream.runCollect(pipeline) // Effect<Array<number>>
export const printed = Stream.runForEach(pipeline, (n) => Effect.log(`${n}`)) // Effect<void>
// #endregion run

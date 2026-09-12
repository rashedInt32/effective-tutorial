import { Effect, Sink, Stream } from "effect"

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
) // Stream<number> — stops after the first chunk; the rest is never produced
// #endregion transform

// #region run
// Nothing runs until you drive the stream into an Effect. `runCollect` gathers
// every element into an array, `runForEach` performs an effect per element, and
// `runDrain` runs purely for the side effects.
export const collected = Stream.runCollect(pipeline) // Effect<Array<number>>
export const printed = Stream.runForEach(pipeline, (n) => Effect.log(`${n}`)) // Effect<void>
export const drained = Stream.runDrain(pipeline) // Effect<void>
// #endregion run

// #region sink
// The `run*` functions are shorthands for the general form: `Stream.run` with a
// `Sink`. A Sink is a reusable, COMPOSABLE consumer — where a stream describes
// producing values, a sink describes folding them into one result.
export const total = Stream.run(pipeline, Sink.sum) //            Effect<number>
export const howMany = Stream.run(pipeline, Sink.count) //        Effect<number>

// Because sinks are values, you build new ones from old. This averages in a
// single pass — no intermediate array, no second traversal.
const average = Sink.reduce(
  () => [0, 0] as [number, number],
  ([sum, n]: [number, number], x: number) => [sum + x, n + 1] as [number, number]
).pipe(Sink.map(([sum, n]) => (n === 0 ? 0 : sum / n)))

export const mean = Stream.run(pipeline, average) // Effect<number>
// #endregion sink

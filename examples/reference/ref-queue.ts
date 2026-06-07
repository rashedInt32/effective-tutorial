import { Effect, Fiber, Queue, Ref } from "effect"

// Effect has no `let` for shared state — mutation lives behind two fiber-safe
// primitives. A `Ref<A>` is a mutable cell; a `Queue<A>` is an async channel
// fibers use to hand work to each other. Both are created inside an Effect.

// #region ref
// A Ref holds a value you read and update atomically — safe even when many fibers
// touch it at once. `update` applies a function; `modify` also returns a value.
export const counter = Effect.gen(function* () {
  const ref = yield* Ref.make(0)
  yield* Ref.update(ref, (n) => n + 1)
  yield* Ref.update(ref, (n) => n + 1)
  return yield* Ref.get(ref) // 2
})
// #endregion ref

// #region queue
// A Queue is an async, back-pressured channel. `offer` adds (suspending if a
// bounded queue is full); `take` removes (suspending if empty) — which is how it
// decouples a producer's pace from a consumer's.
export const buffered = Effect.gen(function* () {
  const queue = yield* Queue.bounded<number>(16)
  yield* Queue.offer(queue, 1)
  yield* Queue.offer(queue, 2)
  return yield* Queue.take(queue) // 1
})
// #endregion queue

// #region together
// The two compose: a producer fiber fills the queue while a consumer drains it,
// tallying into a shared Ref. forkChild keeps both tied to the parent fiber.
export const pipeline = Effect.gen(function* () {
  const queue = yield* Queue.unbounded<number>()
  const total = yield* Ref.make(0)

  const producer = yield* Effect.forkChild(
    Effect.forEach([1, 2, 3], (n) => Queue.offer(queue, n))
  )
  const consumer = yield* Effect.forkChild(
    Effect.forEach([1, 2, 3], () =>
      Queue.take(queue).pipe(Effect.flatMap((n) => Ref.update(total, (t) => t + n)))
    )
  )

  yield* Fiber.join(producer)
  yield* Fiber.join(consumer)
  return yield* Ref.get(total) // 6
})
// #endregion together

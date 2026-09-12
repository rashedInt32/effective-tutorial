import { Effect, Fiber, PubSub } from "effect"

// A `Queue` hands each message to ONE consumer; a `PubSub` broadcasts each
// message to EVERY subscriber. It's the fan-out primitive — events, live
// updates, change notifications — where many independent readers each need their
// own copy of the stream. Every region typechecks against effect@4 beta.

// #region create
// `PubSub.bounded` makes a hub with backpressure: when it's full, publishers wait.
// Like a Queue, creating one is an Effect. Subscribers attach later.
export const hub = PubSub.bounded<number>(16) // Effect<PubSub<number>>
// #endregion create

// #region broadcast
// The defining property: subscribe twice and BOTH subscriptions receive every
// published value — independent copies, not first-come-first-served. `subscribe`
// is scoped, so a subscription unsubscribes automatically when its scope closes.
export const broadcast = Effect.gen(function* () {
  const pubsub = yield* PubSub.bounded<string>(16)
  return yield* Effect.scoped(
    Effect.gen(function* () {
      const left = yield* PubSub.subscribe(pubsub)
      const right = yield* PubSub.subscribe(pubsub)

      // Each subscriber drains its OWN queue. `takeAll` waits for one message
      // then drains what's queued — `publishAll` lands all three at once.
      const a = yield* Effect.forkChild(PubSub.takeAll(left))
      const b = yield* Effect.forkChild(PubSub.takeAll(right))

      yield* PubSub.publishAll(pubsub, ["created", "updated", "deleted"])
      return [yield* Fiber.join(a), yield* Fiber.join(b)] as const
    })
  )
})
// #endregion broadcast

// #region strategies
// The four constructors differ only in what they do when a bounded hub is full —
// pick the one that matches whether you'd rather slow the producer or drop data.
export const withBackpressure = PubSub.bounded<number>(16) // publishers wait
export const dropNewest = PubSub.dropping<number>(16) // reject new when full
export const dropOldest = PubSub.sliding<number>(16) // evict oldest when full
export const grows = PubSub.unbounded<number>() // never blocks, unbounded memory
// #endregion strategies

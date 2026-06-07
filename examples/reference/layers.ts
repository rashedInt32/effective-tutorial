import { Context, Effect, Layer } from "effect"

// A *service* is a typed dependency your code can ASK for; a *Layer* is the recipe
// that BUILDS one. The `R` in `Effect<A, E, R>` is exactly the set of services
// still needed — provide layers until `R` is `never`, and the program can run.

// #region define
// `Context.Service` declares a service in one shot: the class is both the TAG you
// ask for and the SHAPE you get back.
class Logger extends Context.Service<Logger, {
  readonly log: (message: string) => Effect.Effect<void>
}>()("app/Logger") {}

class Greeter extends Context.Service<Greeter, {
  readonly greet: (name: string) => Effect.Effect<void>
}>()("app/Greeter") {}
// #endregion define

// #region use
// Ask for a service by yielding its tag. Using `Greeter` adds it to the program's
// requirements — note the `Greeter` in the type below.
export const program = Effect.gen(function* () {
  const greeter = yield* Greeter
  yield* greeter.greet("Ada")
}) // Effect<void, never, Greeter>
// #endregion use

// #region implement
// A Layer builds a service. `Layer.succeed` for a ready value; `Layer.effect` to
// build one from an Effect — which may itself ASK for other services. Greeter
// depends on Logger, and that dependency shows up in the layer's type.
const LoggerLive = Layer.succeed(Logger, {
  log: (message) => Effect.log(message)
})

const GreeterLive = Layer.effect(
  Greeter,
  Effect.gen(function* () {
    const logger = yield* Logger
    return {
      greet: (name: string) => logger.log(`Hello, ${name}!`)
    }
  })
) // Layer<Greeter, never, Logger>  — still needs Logger
// #endregion implement

// #region provide
// Wire dependencies with `Layer.provide` (feed Logger into Greeter), then satisfy
// the program with `Effect.provide`. Once `R` is `never`, the program is runnable.
const AppLive = GreeterLive.pipe(Layer.provide(LoggerLive)) // Layer<Greeter>

export const runnable = program.pipe(Effect.provide(AppLive)) // Effect<void>
// #endregion provide

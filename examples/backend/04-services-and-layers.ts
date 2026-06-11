import { Context, Effect, Layer, Schema } from "effect"
import {
  HttpRouter,
  HttpServerRespondable,
  HttpServerResponse
} from "effect/unstable/http"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { createServer } from "node:http"

// Lessons 01–03 put all the logic inside the handlers. That doesn't scale: the
// data access, the business rules, and the HTTP wiring all tangle together. The
// fix is a *service* — a typed dependency a handler ASKS for — built by a
// *Layer*. The handler stays about HTTP; the service owns the work; and at the
// edge you choose which implementation to provide (real, or a test double).

// #region model
// The data our API speaks, and a failure that can render ITSELF as a response
// (see Lesson 03 for tagged errors). The repo will fail with this; the router
// turns it into a 404 with no catch in the handler.
export class User extends Schema.Class<User>("User")({
  id: Schema.Number,
  name: Schema.NonEmptyString
}) {}

export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  { id: Schema.Number }
) {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: this._tag, id: this.id }, { status: 404 })
  }
}
// #endregion model

// #region define
// `Context.Service` declares a service in one shot: the class is both the TAG you
// ask for and the SHAPE you get back. This is the *interface* — what callers can
// do, with no hint of how it's done. Methods return Effects so they can fail and
// require things of their own.
export class UserRepo extends Context.Service<UserRepo, {
  readonly findById: (id: number) => Effect.Effect<User, UserNotFound>
  readonly create: (name: string) => Effect.Effect<User>
}>()("app/UserRepo") {}
// #endregion define

// #region use
// A handler ASKS for the service by yielding its tag, then just uses it. Note
// what's NOT here: no database, no array, no knowledge of how users are stored.
// Yielding `UserRepo` adds it to the route's requirements — the type tracks it.
export const getUser = (id: number) =>
  Effect.gen(function* () {
    const repo = yield* UserRepo
    const user = yield* repo.findById(id) // may fail with UserNotFound
    return yield* HttpServerResponse.schemaJson(User)(user)
  })
// #endregion use

// #region build
// A Layer is the RECIPE that builds a service. `Layer.effect` runs an Effect to
// produce the implementation — and that Effect may itself ask for other services
// (a connection, a logger, …), which then show up in the layer's requirements.
// Here it's a simple in-memory store.
export const UserRepoLive = Layer.effect(
  UserRepo,
  Effect.gen(function* () {
    const users = new Map<number, User>([[1, new User({ id: 1, name: "Ada Lovelace" })]])
    let nextId = 2
    return {
      findById: (id) =>
        users.has(id)
          ? Effect.succeed(users.get(id)!)
          : Effect.fail(new UserNotFound({ id })),
      create: (name) =>
        Effect.sync(() => {
          const user = new User({ id: nextId++, name })
          users.set(user.id, user)
          return user
        })
    }
  })
)
// #endregion build

// #region provide
// The handlers above REQUIRE `UserRepo`. The router carries that requirement up
// through `serve`, so you satisfy it at the EDGE — `Layer.provide(UserRepoLive)`
// alongside the platform layer. Swap that one line and the whole server runs on
// a different implementation; nothing inside the handlers changes.
const Routes = HttpRouter.addAll([
  HttpRouter.route("GET", "/users/1", getUser(1))
])

export const HttpLive = HttpRouter.serve(Routes).pipe(
  Layer.provide(UserRepoLive),
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000 }))
)

NodeRuntime.runMain(Layer.launch(HttpLive))
// #endregion provide

// #region swap
// The payoff of asking instead of importing: you can BUILD the same service a
// different way. A test double with fixed data satisfies the very same `UserRepo`
// tag — so the program under test is byte-for-byte the production one, only the
// layer changes. No mocks, no monkey-patching.
export const UserRepoTest = Layer.succeed(UserRepo, {
  findById: (id) =>
    id === 42
      ? Effect.succeed(new User({ id: 42, name: "Test User" }))
      : Effect.fail(new UserNotFound({ id })),
  create: (name) => Effect.succeed(new User({ id: 1, name }))
})

// Same logic, test implementation provided — runnable with no server, no DB.
export const findInTest = Effect.gen(function* () {
  const repo = yield* UserRepo
  return yield* repo.findById(42)
}).pipe(Effect.provide(UserRepoTest)) // Effect<User, UserNotFound>
// #endregion swap

// #region request-scoped
// Some dependencies are per-REQUEST, not per-app — a request id, the current
// user. Router middleware PROVIDES such a service into every wrapped handler;
// declare what it provides, and handlers read it straight from context.
export class RequestId extends Context.Service<RequestId, { value: string }>()("app/RequestId") {}

export const RequestIdLive = HttpRouter.middleware<{ provides: RequestId }>()(
  Effect.succeed((httpEffect) => Effect.provideService(httpEffect, RequestId, { value: "req-123" }))
).layer

export const WhoAmI = HttpRouter.add(
  "GET",
  "/whoami",
  Effect.gen(function* () {
    const { value } = yield* RequestId
    return HttpServerResponse.text(value)
  })
).pipe(Layer.provide(RequestIdLive))
// #endregion request-scoped

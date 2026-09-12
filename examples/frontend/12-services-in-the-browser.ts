import { Context, Data, Effect, Layer } from "effect"
import { Atom } from "effect/unstable/reactivity"

// Lesson 04 made the backend testable with one move: a handler ASKS for a
// service, and you choose the implementation at the edge. That move works
// unchanged on the client. An atom can ask for a service too — which is how you
// get a real API in production and a fake one in a demo, with no code in between
// knowing the difference.

// #region service
// The same `Context.Service` from Lesson 04. Nothing browser-specific about it:
// an interface, with methods that return Effects so they can fail.
export class LoadError extends Data.TaggedError("LoadError")<{ reason: string }> {}

export class UserApi extends Context.Service<UserApi, {
  readonly list: Effect.Effect<ReadonlyArray<string>, LoadError>
}>()("app/UserApi") {}
// #endregion service

// #region layers
// Two implementations of the same interface. In the backend half one of these
// would talk to Postgres; here one succeeds and one always fails, which is what
// makes the error path something you can actually demonstrate.
export const UserApiLive = Layer.succeed(UserApi, {
  list: Effect.succeed(["Ada Lovelace", "Grace Hopper"])
})

export const UserApiBroken = Layer.succeed(UserApi, {
  list: Effect.fail(new LoadError({ reason: "503 from upstream" }))
})
// #endregion layers

// #region runtime
// `Atom.runtime(layer)` builds a runtime that atoms can draw services from. It
// is itself an atom, so the layer is constructed once, lazily, and torn down
// when nothing needs it — the memoization from the Layers guide, on the client.
export const runtime = Atom.runtime(UserApiLive)

// `runtime.atom` is `Atom.make` with the services available. The Effect asks for
// `UserApi`; the runtime satisfies it, so the atom's type has no requirement
// left — exactly like providing a layer at the edge of a server.
export const usersAtom = runtime.atom(
  Effect.flatMap(UserApi, (api) => api.list)
) // Atom<AsyncResult<ReadonlyArray<string>, LoadError>>
// #endregion runtime

// #region swap
// Point the runtime at a different layer and every atom built from it changes
// implementation. No component changes, no prop threading, no mocking library —
// the same swap that let Lesson 06 test a server with no database.
export const brokenRuntime = Atom.runtime(UserApiBroken)

export const brokenUsersAtom = brokenRuntime.atom(
  Effect.flatMap(UserApi, (api) => api.list)
)
// #endregion swap

// #region fn
// For a WRITE, `runtime.fn` makes an atom you call with an argument. The result
// is an AsyncResult like any other, so a pending save gets `waiting` for free.
export const addUser = runtime.fn(
  Effect.fnUntraced(function* (name: string) {
    yield* Effect.sleep("300 millis")
    return `added ${name}`
  })
)
// #endregion fn

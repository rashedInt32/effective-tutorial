import { Cause, Context, Effect, Exit, Layer, ManagedRuntime } from "effect"

// The problem: every server component, route handler, and server action needs
// your services (db, config, loggers). Building the layer per-request is wasteful
// and breaks resource sharing. The fix: build ONE runtime from your app's layer,
// once, and run every effect through it. This file is that pattern, end to end —
// and it all typechecks against effect@4 beta.

// #region services
// Your app's services. In a real app this is your database, cache, auth, config —
// here, a tiny config value and a stubbed user store stand in for them.
class Config extends Context.Service<Config, { readonly greeting: string }>()(
  "app/Config"
) {}

class Users extends Context.Service<Users, {
  readonly byId: (id: number) => Effect.Effect<{ id: number; name: string }>
}>()("app/Users") {}
// #endregion services

// #region layer
// Each service gets a Layer; `mergeAll` composes them into ONE layer that
// describes the whole dependency graph. Because nothing is left unprovided, its
// requirements (`RIn`) are `never` — the precondition for a runnable runtime.
const ConfigLive = Layer.succeed(Config, { greeting: "Hello" })

const UsersLive = Layer.succeed(Users, {
  byId: (id) => Effect.succeed({ id, name: `User ${id}` })
})

export const AppLayer = Layer.mergeAll(ConfigLive, UsersLive)
// #endregion layer

// #region runtime
// Build the runtime from that layer. It builds the layer lazily on first use,
// caches the resulting services, and OWNS their lifecycle — pools, connections,
// and anything else the layer acquires live for as long as the runtime does.
export const runtime = ManagedRuntime.make(AppLayer)
// #endregion runtime

// #region singleton
// Next.js re-evaluates modules on every edit in dev — a naive `make` would build
// a fresh runtime (and a fresh DB pool) on each reload. Cache it on `globalThis`
// so there is exactly ONE runtime across reloads. This is your single source of truth.
const globalForRuntime = globalThis as unknown as {
  appRuntime?: ManagedRuntime.ManagedRuntime<Layer.Success<typeof AppLayer>, never>
}

export const appRuntime = globalForRuntime.appRuntime ?? ManagedRuntime.make(AppLayer)

if (process.env.NODE_ENV !== "production") {
  globalForRuntime.appRuntime = appRuntime
}
// #endregion singleton

// #region run-rsc
// In a Server Component (an async function), run an effect to its data and render.
// `runPromise` resolves the value; the services are injected from the runtime.
export async function UserCard({ id }: { id: number }) {
  const text = await appRuntime.runPromise(
    Effect.gen(function* () {
      const config = yield* Config
      const users = yield* Users
      const user = yield* users.byId(id)
      return `${config.greeting}, ${user.name}`
    })
  )
  return text // a real component would return <div>{text}</div>
}
// #endregion run-rsc

// #region run-route
// In a Route Handler (app/api/users/route.ts), run the effect and build a Response.
export async function GET(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id") ?? "1")
  const user = await appRuntime.runPromise(Effect.flatMap(Users, (users) => users.byId(id)))
  return Response.json(user)
}
// #endregion run-route

// #region run-action
// In a Server Action, prefer `runPromiseExit`: layer-construction AND effect
// failures come back as a typed `Exit` you branch on, instead of a thrown error.
export async function greetAction(id: number) {
  const exit = await appRuntime.runPromiseExit(Effect.flatMap(Users, (users) => users.byId(id)))
  return Exit.match(exit, {
    onSuccess: (user) => ({ ok: true as const, user }),
    onFailure: (cause) => ({ ok: false as const, error: Cause.pretty(cause) })
  })
}
// #endregion run-action

// #region lifecycle
// `runFork` launches a long-lived effect without awaiting it (background work,
// warmups). `dispose` closes the runtime's scope and releases every resource the
// layer acquired — call it from your process shutdown hook.
export const warmup = appRuntime.runFork(Effect.log("warming caches"))

export const shutdown = () => appRuntime.dispose()
// #endregion lifecycle

// #region capstone
// lib/runtime.ts — the one module your whole app imports from. Swap the stub
// layers for your real ones (a SqlClient layer, a logger, config from env), keep
// the singleton, and expose a single typed `runEffect` helper so call sites never
// touch `ManagedRuntime` directly.
type AppServices = Layer.Success<typeof AppLayer>

export const runEffect = <A, E>(effect: Effect.Effect<A, E, AppServices>): Promise<A> =>
  appRuntime.runPromise(effect)

// every call site is now a one-liner:
export const getGreeting = (id: number) =>
  runEffect(
    Effect.gen(function* () {
      const config = yield* Config
      const user = yield* (yield* Users).byId(id)
      return `${config.greeting}, ${user.name}`
    })
  )
// #endregion capstone

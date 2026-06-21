import { Context, Cron, Effect, FiberSet, Layer, Schedule } from "effect"

// Not every job belongs on the request path. Sending the welcome email, sweeping
// expired sessions, reconciling a ledger at 02:00 — these run on their own
// fibers, on a schedule, supervised so a crash is visible and shutdown is clean.
// Effect gives you forking, repetition policies, and Scope-bound lifetimes for
// exactly this. Every region typechecks against effect@4 beta.

// #region fork
// `Effect.forkScoped` runs an effect on a NEW fiber and ties its life to the
// surrounding Scope: when the scope closes, the fiber is interrupted. So a slow
// job started inside a request finishes (or is cancelled) with that request —
// no orphaned work, no leak. The handler returns immediately with the fiber.
export const handle = Effect.gen(function* () {
  const job = yield* Effect.forkScoped(sendWelcomeEmail)
  // ...respond now; `job` keeps running in the background, bounded by the scope.
  return job
})

const sendWelcomeEmail = Effect.sleep("2 seconds")
// #endregion fork

// #region fiberset
// One background job is a fiber; many are a `FiberSet` — a scoped supervisor.
// `FiberSet.run` forks an effect into the set and removes it on completion; when
// the set's scope closes, every fiber still running is interrupted together.
export const fanOut = Effect.gen(function* () {
  const set = yield* FiberSet.make<void>()
  for (const id of ["a", "b", "c"]) {
    yield* FiberSet.run(set, processUpload(id))
  }
  // The scope owns them now — nothing escapes it.
})

const processUpload = (id: string) => Effect.sleep("1 second").pipe(Effect.as(id))
// #endregion fiberset

// #region repeat
// A recurring job is one effect plus a `Schedule` — a reusable policy for WHEN
// to run again. `Schedule.spaced` waits a fixed gap after each run; `fixed`
// holds a steady wall-clock cadence even if a run takes a while. `repeat` drives
// the effect forever (until it fails or its fiber is interrupted).
const sweepExpiredSessions = Effect.logInfo("swept expired sessions")

export const sweepLoop = Effect.repeat(sweepExpiredSessions, Schedule.spaced("5 minutes"))
// #endregion repeat

// #region cron
// For calendar-based timing, `Schedule.cron` fires on a cron expression. Parse
// it once (`Cron.parseUnsafe` throws on a bad literal, which is what you want at
// boot) and repeat against it — here, 02:00 every day.
const reconcileLedger = Effect.logInfo("reconciled the ledger")

export const nightly = Effect.repeat(
  reconcileLedger,
  Schedule.cron(Cron.parseUnsafe("0 2 * * *"))
)
// #endregion cron

// #region worker
// Package the whole thing as a service `Layer`. `Layer.effect` runs inside the
// layer's Scope, so forking the loop with `FiberSet` means the worker STARTS
// when the app boots and STOPS — fibers interrupted, cleanly — when the app
// shuts down. Provide it alongside your server and background work just runs.
export class Scheduler extends Context.Service<Scheduler, {
  readonly running: boolean
}>()("app/Scheduler") {}

export const SchedulerLive = Layer.effect(
  Scheduler,
  Effect.gen(function* () {
    const set = yield* FiberSet.make<void>()
    yield* FiberSet.run(set, sweepLoop)
    yield* FiberSet.run(set, nightly)
    return { running: true }
  })
)
// #endregion worker

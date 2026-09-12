import { Cron, Effect, FiberSet, Layer, Schedule } from "effect"

// Not every job belongs on the request path. Sending the welcome email, sweeping
// expired sessions, reconciling a ledger at 02:00 — these run on their own
// fibers, on a schedule, supervised so a crash is visible and shutdown is clean.
// Effect gives you forking, repetition policies, and Scope-bound lifetimes for
// exactly this.

// #region fork
// `Effect.forkScoped` runs an effect on a NEW fiber and ties its life to the
// surrounding Scope: when the scope closes, the fiber is INTERRUPTED. A route
// handler runs in a per-request scope, so a fiber forked here lives exactly as
// long as the request — ideal for work that should stop when the caller leaves.
// Work that must OUTLIVE the request belongs in an app-scoped FiberSet (below).
export const handle = Effect.gen(function* () {
  const job = yield* Effect.forkScoped(streamProgress)
  // ...respond now; when the response is sent the scope closes and `job` stops.
  return job
})

const streamProgress = Effect.sleep("2 seconds")
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
// A failure ENDS the repeat, so catch inside the loop body when the schedule
// should survive one bad run.
const sweepExpiredSessions = Effect.logInfo("swept expired sessions")

export const sweepLoop = sweepExpiredSessions.pipe(
  Effect.catchCause((cause) => Effect.logError("sweep failed", cause)),
  Effect.repeat(Schedule.spaced("5 minutes"))
)
// #endregion repeat

// #region cron
// For calendar-based timing, `Schedule.cron` fires on a cron expression. It
// accepts the string directly (a bad one fails the effect with CronParseError);
// parsing up front with `Cron.parseUnsafe` instead throws at BOOT, which is what
// you want for a literal. Always name the zone — here 02:00 daily, UTC.
const reconcileLedger = Effect.logInfo("reconciled the ledger")

export const nightly = Effect.repeat(
  reconcileLedger,
  Schedule.cron(Cron.parseUnsafe("0 2 * * *", "UTC"))
)
// #endregion cron

// #region worker
// Package the whole thing as a `Layer` that provides nothing but OWNS the
// fibers. `Layer.effectDiscard` runs inside the layer's Scope, so the worker
// STARTS when the app boots and STOPS — every fiber interrupted, cleanly — when
// the layer is torn down. Provide it alongside your server.
export const SchedulerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const set = yield* FiberSet.make<void>()
    yield* FiberSet.run(set, sweepLoop)
    yield* FiberSet.run(set, nightly)
  })
)

// `runMain` interrupts the main fiber on SIGINT/SIGTERM. That closes the layer
// scope, so the FiberSet interrupts every loop before the process exits.
// NodeRuntime.runMain(Layer.launch(Layer.mergeAll(HttpLive, SchedulerLive)))
// #endregion worker

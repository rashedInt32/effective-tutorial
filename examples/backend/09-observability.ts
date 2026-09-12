import { Effect, Logger, Metric } from "effect"

// "It works on my machine" ends where production begins; after that you only
// know what you measured. Effect builds the three pillars in — structured logs,
// distributed traces, and metrics — on the same context that already threads
// through your program, so adding them is wrapping, not rewiring. Every region
// typechecks against the installed effect@4.

// #region log
// Logging is an Effect, so a log line carries the fiber's context for free.
// `logInfo`/`logError` write at a level; `annotateLogs` attaches structured
// fields to every log emitted by the wrapped effect — so one annotation at the
// edge stamps `requestId` onto everything downstream, no plumbing through args.
export const handle = Effect.gen(function* () {
  yield* Effect.logInfo("handling request")
  yield* doWork
  yield* Effect.logInfo("done")
}).pipe(Effect.annotateLogs({ requestId: "req-42", route: "GET /users" }))

const doWork = Effect.void
// #endregion log

// #region install
// The default logger prints human-readable lines. In production you want machine
// -readable ones: `Logger.layer([Logger.consoleJson])` swaps the logger app-wide
// for structured JSON — same `logInfo` calls, now emitted with their level,
// timestamp, annotations, and spans as JSON your log aggregator can index.
export const JsonLogging = Logger.layer([Logger.consoleJson])

export const runnable = handle.pipe(Effect.provide(JsonLogging))
// #endregion install

// #region span
// A span is a timed, named, nestable unit of work — the backbone of tracing.
// `withSpan` wraps any effect in one; `annotateCurrentSpan` hangs attributes on
// it. Nest spans and you get a flame graph of a request for free, exported to
// any OpenTelemetry backend once you provide a Tracer at the edge.
export const traced = Effect.gen(function* () {
  yield* Effect.annotateCurrentSpan("user.id", "user-2")
  return yield* loadUser
}).pipe(Effect.withSpan("loadUser", { attributes: { "db.system": "postgres" } }))

const loadUser = Effect.succeed({ id: "user-2" })
// #endregion span

// #region metric
// Metrics are cheap aggregates over time. A `counter` only goes up (requests
// served); a `histogram` records a distribution (latencies into buckets).
// `Metric.update` feeds a data point; the runtime keeps the running aggregate,
// ready to scrape — no per-event storage, unlike logs.
export const requests = Metric.counter("http_requests_total", {
  description: "Total HTTP requests served"
})

// `timer` is a histogram of Durations — the histogram you'd otherwise build by
// hand with `Metric.histogram` + `linearBoundaries`. `Effect.timed` hands back
// how long the work actually took, so the number is measured, not made up.
export const latency = Metric.timer("http_request_duration", {
  description: "Request latency"
})

export const measured = Effect.gen(function* () {
  yield* Metric.update(requests, 1)
  const [duration, result] = yield* Effect.timed(doWork)
  yield* Metric.update(latency, duration)
  return result
})
// #endregion metric

// #region observable
// All three compose as one wrapper. The handler stays about its job; the
// observability is a pipe at the boundary — a span around it, JSON logs under
// it, metrics recorded within. Add it once here, get it on every request.
export const observed = measured.pipe(
  Effect.withSpan("GET /users"),
  Effect.annotateLogs({ route: "GET /users" }),
  Effect.provide(JsonLogging)
)
// #endregion observable

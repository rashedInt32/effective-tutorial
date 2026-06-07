import { Data, Duration, Effect, Schedule } from "effect"

// Effect makes failure a typed, first-class value: every way an effect can fail
// shows up in its `E` channel, and you recover with combinators instead of
// try/catch. Unexpected, unrecoverable problems are "defects" — a separate lane
// you usually let crash rather than handle.

// #region fail
// A recoverable failure is a typed value in the E channel — model it as a tagged
// error so distinct failures stay distinguishable. `die` raises a defect (a bug),
// which is NOT part of the typed error channel.
class NotFound extends Data.TaggedError("NotFound")<{ id: number }> {}
class Timeout extends Data.TaggedError("Timeout")<{ afterMs: number }> {}

export const missing = Effect.fail(new NotFound({ id: 7 })) // Effect<never, NotFound>
export const boom = Effect.die(new Error("unreachable")) //    Effect<never> — a defect
// #endregion fail

// #region catch-tag
// Recover one failure by its tag, or several at once with a record. Handled tags
// leave the error channel; whatever you don't catch stays in the type.
declare const load: Effect.Effect<string, NotFound | Timeout>

export const recovered = load.pipe(
  Effect.catchTag("NotFound", (e) => Effect.succeed(`no user ${e.id}`))
) // Effect<string, Timeout>  — Timeout is still unhandled

export const recoveredAll = load.pipe(
  Effect.catchTags({
    NotFound: (e) => Effect.succeed(`no user ${e.id}`),
    Timeout: (e) => Effect.succeed(`timed out after ${e.afterMs}ms`)
  })
) // Effect<string>
// #endregion catch-tag

// #region fold
// Collapse both channels into one value with `match`, or give a blanket fallback
// with `orElseSucceed`. (`catchCause` reaches the full cause, defects included.)
export const described = load.pipe(
  Effect.match({
    onFailure: (e) => `failed: ${e._tag}`,
    onSuccess: (value) => `ok: ${value}`
  })
) // Effect<string>

export const orDefault = load.pipe(Effect.orElseSucceed(() => "fallback"))
// #endregion fold

// #region retry
// Retry typed failures on a policy: a simple count, or a Schedule such as capped
// exponential backoff. The effect runs once, then the policy governs re-runs.
export const thrice = load.pipe(Effect.retry({ times: 3 }))

export const backoff = load.pipe(
  Effect.retry(Schedule.exponential(Duration.millis(100)))
)
// #endregion retry

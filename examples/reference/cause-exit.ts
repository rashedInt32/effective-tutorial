import { Cause, Data, Effect, Exit } from "effect"

// Every Effect ends in exactly one of two ways, and `Exit<A, E>` is that ending
// as a VALUE: `Success` carrying an A, or `Failure` carrying a `Cause<E>`. The
// Cause is the "why" — and there are three of them, which is the thing most
// people miss: a typed failure, a defect, or an interruption.

// #region three
// The three ways an effect can end badly. Only the FIRST is in your `E` type.
class NotFound extends Data.TaggedError("NotFound")<{ id: number }> {}

export const failed = Effect.fail(new NotFound({ id: 7 })) // Effect<never, NotFound>
export const died = Effect.die(new Error("bug: unreachable")) // Effect<never> — a DEFECT
export const stopped = Effect.interrupt //                       Effect<never> — INTERRUPTED
// #endregion three

// #region capture
// `Effect.exit` turns any outcome into a value you can look at. The error
// channel becomes `never`, because failing is no longer how it ends — the Exit
// describes the ending instead. This is what a test asserts on.
export const outcome = Effect.exit(failed) // Effect<Exit<never, NotFound>>
// #endregion capture

// #region match
// `Exit.match` folds both sides into one value. The failure side hands you the
// whole `Cause`, not a bare error — because "it failed" isn't the whole story.
export const describe = Effect.map(
  outcome,
  Exit.match({
    onSuccess: (value) => `ok: ${value}`,
    onFailure: (cause) => `failed: ${Cause.pretty(cause)}`
  })
) // Effect<string>
// #endregion match

// #region inspect
// Ask the Cause what actually happened. `findError` returns your typed error if
// there was one; `hasDies` and `hasInterrupts` answer the other two questions.
// `squash` is the shortcut: the typed error if present, else the defect.
export const classify = (cause: Cause.Cause<NotFound>) =>
  Cause.hasInterrupts(cause)
    ? "the fiber was interrupted"
    : Cause.hasDies(cause)
      ? "a defect — this is a bug"
      : `a typed failure: ${Cause.squash(cause)}`
// #endregion inspect

// #region handle
// In normal code you rarely build a Cause — you catch one. `catchCause` sees
// every ending, so it's how you log a defect instead of losing it. (`catchTag`
// and friends only see the typed side.)
export const logged = failed.pipe(
  Effect.catchCause((cause) =>
    Effect.logError(`request failed: ${Cause.pretty(cause)}`)
  )
) // Effect<void>
// #endregion handle

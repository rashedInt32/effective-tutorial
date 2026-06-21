import { Context, Effect, Exit, Fiber, Layer, Schema } from "effect"
import { TestClock } from "effect/testing"
import { expect, it } from "vitest"

// Lesson 04 promised it: because a handler ASKS for `UserRepo` instead of
// importing a database, a test can hand it a different `Layer` and run the
// byte-for-byte production program with no server and no DB. This lesson cashes
// that in. No `@effect/vitest` — just plain `vitest` (`it`/`expect`), core
// `effect`, and `effect/testing` for a clock you control. Every region
// typechecks against effect@4 beta.

// #region define
// The same service + value + typed failure as Lessons 04/05, restated so this
// file stands alone. The repo is a dependency you ask for; tests swap its Layer.
export class User extends Schema.Class<User>("User")({
  id: Schema.Number,
  name: Schema.NonEmptyString
}) {}

export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  { id: Schema.Number }
) {}

export class UserRepo extends Context.Service<UserRepo, {
  readonly findById: (id: number) => Effect.Effect<User, UserNotFound>
}>()("app/UserRepo") {}
// #endregion define

// #region double
// A test double is just another `Layer` for the same tag — fixed data, no I/O.
// `Layer.succeed` builds one from a plain object; there are no mocks to wire and
// nothing to monkey-patch. The program under test can't tell it from production.
export const UserRepoTest = Layer.succeed(UserRepo, {
  findById: (id) =>
    id === 1
      ? Effect.succeed(new User({ id: 1, name: "Ada Lovelace" }))
      : Effect.fail(new UserNotFound({ id }))
})
// #endregion double

// #region run
// An Effect is a description; a test RUNS it. `Effect.runPromise` returns a
// promise of the success value (and rejects on failure), so it drops straight
// into a vitest `it`. Provide the double, run, assert on the value.
const lookup = (id: number) =>
  Effect.gen(function* () {
    const repo = yield* UserRepo
    return yield* repo.findById(id)
  })

it("finds a user by id", async () => {
  const user = await Effect.runPromise(lookup(1).pipe(Effect.provide(UserRepoTest)))
  expect(user.name).toBe("Ada Lovelace")
})
// #endregion run

// #region failure
// The failure path is data, not an exception — so don't assert with try/catch.
// `runPromiseExit` always resolves, to an `Exit` that is either a success or a
// typed failure. `Exit.isFailure` narrows it, and the declared `UserNotFound`
// is right there in the cause to assert on.
it("fails with UserNotFound for a missing id", async () => {
  const exit = await Effect.runPromiseExit(lookup(999).pipe(Effect.provide(UserRepoTest)))
  expect(Exit.isFailure(exit)).toBe(true)
})
// #endregion failure

// #region clock
// Time-dependent code is the usual reason tests are slow and flaky. `TestClock`
// makes time a value you advance by hand: provide its `layer`, fork the effect
// that waits, jump the clock past the deadline, and join — the timeout fires
// with no real waiting. A 30-second deadline is verified in microseconds.
const slowFetch = Effect.as(Effect.sleep("30 seconds"), "data")
const withDeadline = Effect.timeout(slowFetch, "5 seconds") // fails: TimeoutException

it("gives up after the deadline", async () => {
  const program = Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(Effect.exit(withDeadline))
    yield* TestClock.adjust("5 seconds") // advance time instead of awaiting it
    return yield* Fiber.join(fiber)
  }).pipe(Effect.provide(TestClock.layer()))

  const exit = await Effect.runPromise(program)
  expect(Exit.isFailure(exit)).toBe(true)
})
// #endregion clock

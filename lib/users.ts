import { Effect, Schema } from "effect"

// A domain model, defined as a Schema so it can decode untrusted input
// (form bodies, JSON payloads) and serialize back out.
export const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.NonEmptyString,
  email: Schema.String
})
export type User = typeof User.Type

// A serializable, type-safe domain error. The `_tag` enables pattern matching,
// and it is "yieldable" — usable directly in a generator without Effect.fail.
export class InvalidEmailError extends Schema.TaggedErrorClass<InvalidEmailError>()(
  "InvalidEmailError",
  {
    email: Schema.String
  }
) {}

// `Effect.fn` gives the effect a name and call-site tracing. The signature is
// clean: the error channel infers `ParseError | InvalidEmailError`, and the
// requirements channel is `never` (no services needed).
export const parseUser = Effect.fn("parseUser")(function* (input: unknown) {
  const user = yield* Schema.decodeUnknownEffect(User)(input)

  if (!user.email.includes("@")) {
    return yield* new InvalidEmailError({ email: user.email })
  }

  yield* Effect.logInfo(`Parsed user: ${user.name}`)
  return user
})

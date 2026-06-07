import { Effect, Schema } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http"

// Lesson 02 returned JSON and name-dropped the schema decoders. This lesson is
// about Schema at the HTTP boundary: validate untrusted input, model failures as
// typed data, and encode responses through the same schemas. See
// 01-create-and-run-server.ts for how these routes get served.

// #region model
// A value's *meaning* should live in its type, not just its shape. `.check(...)`
// attaches a runtime constraint (here, an email-ish pattern); `Schema.brand`
// makes the result unmixable with a plain string. (Refinement constructors are
// `Schema.is*` — e.g. isPattern, isMinLength, isBetween.)
const Email = Schema.String.check(Schema.isPattern(/^[^@\s]+@[^@\s]+$/)).pipe(
  Schema.brand("Email")
)

// A `Schema.Class` is one declaration that yields a constructor, a TS type, and
// an encoder/decoder. This is the data our API speaks.
export class User extends Schema.Class<User>("User")({
  id: Schema.Number,
  name: Schema.NonEmptyString,
  email: Email,
  age: Schema.Number.check(Schema.isBetween({ minimum: 0, maximum: 150 })),
  createdAt: Schema.Date
}) {}
// #endregion model

// #region payload
// The body we accept from an untrusted client is NOT the success model: the
// server owns `id` and `createdAt`, so the payload schema simply omits them.
const CreateUser = Schema.Struct({
  name: Schema.NonEmptyString,
  email: Email,
  age: Schema.Number.check(Schema.isBetween({ minimum: 0, maximum: 150 }))
})
// #endregion payload

// #region decode
// `schemaBodyJson` reads the body AND decodes it in one step. `input` is fully
// typed (name is non-empty, email is branded, age is in range); a malformed body
// never reaches this line — it fails the Effect with `Schema.SchemaError`.
export const createUser = Effect.gen(function* () {
  const input = yield* HttpServerRequest.schemaBodyJson(CreateUser)
  const user = new User({
    id: 1,
    name: input.name,
    email: input.email,
    age: input.age,
    createdAt: new Date()
  })
  return yield* HttpServerResponse.schemaJson(User)(user)
})
// #endregion decode

// Every part of the request decodes the same way — only the source differs.

// #region parts-body
// JSON request body -> a typed value (POST/PUT/PATCH).
export const fromBody = HttpServerRequest.schemaBodyJson(CreateUser)
// #endregion parts-body

// #region parts-query
// ?role=admin&tags=a&tags=b -> decoded from the string-keyed search params.
const Filters = Schema.Struct({
  role: Schema.Literals(["admin", "user"]),
  tags: Schema.Array(Schema.String)
})
export const fromQuery = HttpServerRequest.schemaSearchParams(Filters)
// #endregion parts-query

// #region parts-headers
// Required headers, validated like everything else (missing key -> SchemaError).
const ApiHeaders = Schema.Struct({ "x-api-key": Schema.NonEmptyString })
export const fromHeaders = HttpServerRequest.schemaHeaders(ApiHeaders)
// #endregion parts-headers

// #region invalid
// A decode failure is data, not a thrown surprise. Catch the `SchemaError` by
// its tag and turn it into one clean 400 — the single place untrusted input
// becomes a response. `error.message` is a human-readable description of what
// failed and where.
export const createUserSafe = createUser.pipe(
  Effect.catchTag("SchemaError", (error) =>
    HttpServerResponse.json(
      { error: "ValidationFailed", detail: error.message },
      { status: 400 }
    )
  )
)
// #endregion invalid

// #region errors
// Your domain failures are schemas too: serializable, tagged, and pattern-
// matchable. The `_tag` drives the match; each carries the data its caller needs.
export class EmailTaken extends Schema.TaggedErrorClass<EmailTaken>()(
  "EmailTaken",
  { email: Schema.String }
) {}

export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  { id: Schema.Number }
) {}
// #endregion errors

// #region handle-errors
// A stub lookup with a typed failure surface...
const findUser = (id: number): Effect.Effect<User, UserNotFound> =>
  id === 1
    ? Effect.succeed(
        new User({
          id,
          name: "Ada Lovelace",
          email: Email.make("ada@example.com"),
          age: 36,
          createdAt: new Date()
        })
      )
    : Effect.fail(new UserNotFound({ id }))

// ...mapped to a status per tag. The compiler knows the full error surface, so
// forgetting a case is a type error — never an unhandled 500.
export const getUser = (id: number) =>
  findUser(id).pipe(
    Effect.flatMap(HttpServerResponse.schemaJson(User)),
    Effect.catchTag("UserNotFound", (e) =>
      HttpServerResponse.json({ error: e._tag, id: e.id }, { status: 404 })
    )
  )
// #endregion handle-errors

// #region encode
// `schemaJson` encodes THROUGH the schema before serializing: `createdAt` (a
// Date) becomes an ISO 8601 string and `email` keeps its brand, while any field
// the schema omits can never leak onto the wire. It returns a reusable encoder.
const encodeUser = HttpServerResponse.schemaJson(User)
export const created = (user: User) =>
  encodeUser(user).pipe(Effect.map(HttpServerResponse.setStatus(201)))
// #endregion encode

// #region routes
// Wire the handlers. `route` builds a value; `addAll` turns the list into the
// router Layer — then serve it exactly as in Lesson 01.
export const Routes = HttpRouter.addAll([
  HttpRouter.route("POST", "/users", createUserSafe),
  HttpRouter.route("GET", "/users/1", getUser(1))
])
// #endregion routes

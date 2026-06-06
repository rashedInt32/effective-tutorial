import { Effect, Schema } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http"

// Lesson 01 stood up a server that replied with plain text. Now: real
// endpoints — JSON bodies, status codes, headers, and reading what the client
// sent. See 01-create-and-run-server.ts for how these routes get served.

// #region json
// `json` serializes the value with JSON.stringify. That can fail (a BigInt, a
// circular object), so it returns an Effect that fails with HttpBodyError —
// not a bare response. The handler simply *is* that Effect.
export const getUser = HttpServerResponse.json({
  id: 1,
  name: "Ada Lovelace",
  admin: true
})
// #endregion json

// The same JSON reply, three ways — pick by how much safety you need.

// #region body-json
// `json` — the default. Encoding failures live in the error channel
// (HttpBodyError), so a bad body can never silently become a 200.
export const safe = HttpServerResponse.json({ ok: true })
// #endregion body-json

// #region body-unsafe
// `jsonUnsafe` — synchronous. No Effect, no HttpBodyError; JSON.stringify just
// throws on failure. Reach for it only when the body is provably serializable.
export const unsafe = HttpServerResponse.jsonUnsafe({ ok: true })
// #endregion body-unsafe

// #region body-schema
// `schemaJson` — encode through a Schema first. You get validation, branded
// types, and transforms (Date → ISO string) for free before serialization.
const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  admin: Schema.Boolean
})

const userJson = HttpServerResponse.schemaJson(User)
export const typed = userJson({ id: 1, name: "Ada Lovelace", admin: true })
// #endregion body-schema

// #region status
// Set the status inline via the options object...
export const created = HttpServerResponse.json({ id: 7 }, { status: 201 })

// ...or layer `setStatus` onto an existing response with pipe.
export const accepted = HttpServerResponse.text("queued").pipe(
  HttpServerResponse.setStatus(202, "Accepted")
)
// #endregion status

// #region headers
// `setHeader` sets one; `setHeaders` merges several. Both are immutable —
// each returns a new response — so they chain cleanly in a pipe.
export const pong = HttpServerResponse.text("pong").pipe(
  HttpServerResponse.setHeader("x-powered-by", "effect"),
  HttpServerResponse.setHeaders({
    "cache-control": "no-store",
    "x-request-id": "req_abc123"
  })
)
// #endregion headers

// #region read-body
// A handler can be a *function of the request*. `request.json` reads and parses
// the body — it's an Effect because the read or parse can fail. Echo it back.
export const echo = (request: HttpServerRequest.HttpServerRequest) =>
  Effect.gen(function* () {
    const body = yield* request.json
    return yield* HttpServerResponse.json({ youSent: body })
  })
// #endregion read-body

// #region routes
// Register the endpoints. `route` builds a value; `addAll` turns the list into
// the router Layer — then serve it exactly as in Lesson 01.
export const Routes = HttpRouter.addAll([
  HttpRouter.route("GET", "/user", getUser),
  HttpRouter.route("POST", "/echo", echo)
])
// #endregion routes

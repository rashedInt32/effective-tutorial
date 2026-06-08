import { Context, Effect, Layer, Schema } from "effect"
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpRouter,
  HttpServerRequest,
  HttpServerRespondable,
  HttpServerResponse
} from "effect/unstable/http"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { createServer } from "node:http"

// The lower-level building blocks under `effect/unstable/http` — the pieces
// `httpapi` is built ON TOP of. You wire the request → handler → response
// pipeline by hand: read the request, build a response, register routes on a
// router, wrap them in middleware, then serve. Every region below typechecks
// against effect@4 beta.

// #region model
// The data this server speaks. A `Schema.Class` is one declaration that yields a
// constructor, a TS type, and an encoder/decoder — reused on both sides of the wire.
export class User extends Schema.Class<User>("User")({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String
}) {}
// #endregion model

// #region handler
// A handler is just an Effect that yields an `HttpServerResponse`. Three shapes,
// all accepted by the router:
export const asValue = HttpServerResponse.text("pong") // a bare response value
export const asEffect = Effect.succeed(HttpServerResponse.text("pong")) // an Effect
export const asFnOfRequest = (request: HttpServerRequest.HttpServerRequest) =>
  Effect.succeed(HttpServerResponse.text(`${request.method} ${request.url}`)) // a function of the request
// #endregion handler

// #region request
// `HttpServerRequest` is a service carrying the live request. Read its fields
// directly; the body accessors are Effects because a read/parse can fail.
export const inspect = (request: HttpServerRequest.HttpServerRequest) =>
  Effect.gen(function* () {
    const method = request.method // "GET" | "POST" | ...
    const url = request.url // "/users?page=2"
    const headers = request.headers // Headers — lowercased keys
    const cookies = request.cookies // Record<string, string>
    const body = yield* request.json // Effect<unknown, HttpServerError>
    return yield* HttpServerResponse.json({ method, url, headerKeys: Object.keys(headers), cookies, body })
  })
// #endregion request

// #region req-schema
// Decode each part of the request through a Schema. Input is validated and
// typed; a malformed request fails the Effect with a `SchemaError` (→ 400).
const CreateUser = Schema.Struct({ name: Schema.NonEmptyString, email: Schema.String })

// JSON body -> typed value
export const fromBody = HttpServerRequest.schemaBodyJson(CreateUser)
// ?page=2&tag=a&tag=b -> decoded from the search params
export const fromQuery = HttpServerRequest.schemaSearchParams(
  Schema.Struct({ page: Schema.NumberFromString, tag: Schema.Array(Schema.String) })
)
// required headers, validated like everything else
export const fromHeaders = HttpServerRequest.schemaHeaders(
  Schema.Struct({ "x-api-key": Schema.NonEmptyString })
)
// #endregion req-schema

// #region response
// Constructors for the common response bodies. The JSON ones come in two flavors:
// `json` returns an Effect (encoding can fail), `jsonUnsafe` is synchronous.
export const r1 = HttpServerResponse.text("hello") // text/plain
export const r2 = HttpServerResponse.json({ ok: true }) // Effect<_, HttpBodyError>
export const r3 = HttpServerResponse.jsonUnsafe({ ok: true }) // sync — throws on bad input
export const r4 = HttpServerResponse.html("<h1>hi</h1>") // text/html
export const r5 = HttpServerResponse.empty() // 204 No Content
export const r6 = HttpServerResponse.redirect("/login") // 302
export const r7 = HttpServerResponse.uint8Array(new Uint8Array([1, 2, 3])) // binary
// #endregion response

// #region response-mods
// Combinators layer onto a response immutably — each returns a new value, so
// they chain in a pipe. `schemaJson` encodes a value THROUGH a schema first.
export const created = HttpServerResponse.text("done").pipe(
  HttpServerResponse.setStatus(201, "Created"),
  HttpServerResponse.setHeader("x-powered-by", "effect"),
  HttpServerResponse.setHeaders({ "cache-control": "no-store" })
)

// A reusable encoder: Date -> ISO string, brands preserved, omitted fields can't leak.
export const encodeUser = HttpServerResponse.schemaJson(User)
export const userResponse = encodeUser(new User({ id: 1, name: "Ada", email: "ada@example.com" }))
// #endregion response-mods

// #region router
// A route binds method + path + handler. `add` registers one route as a Layer;
// `addAll` batches several built with `route`. Handlers may be a value, an Effect,
// or a function of the request.
export const Hello = HttpRouter.add("GET", "/", HttpServerResponse.text("Hello!"))

export const ApiRoutes = HttpRouter.addAll([
  HttpRouter.route("GET", "/health", HttpServerResponse.json({ status: "ok" })),
  HttpRouter.route("POST", "/echo", (request) =>
    Effect.gen(function* () {
      const body = yield* request.json
      return yield* HttpServerResponse.json({ youSent: body })
    })
  )
])
// #endregion router

// #region params
// `:id` in the path is a captured parameter. Read the raw record with
// `HttpRouter.params`, or decode it through a schema with `schemaParams` to get
// typed values. (The router auto-provides the param context — no plumbing.)
export const GetUser = HttpRouter.add(
  "GET",
  "/users/:id",
  Effect.gen(function* () {
    const { id } = yield* HttpRouter.params // id: string | undefined
    return HttpServerResponse.text(`user ${id}`)
  })
)

export const GetUserTyped = HttpRouter.add(
  "GET",
  "/users/:id",
  Effect.gen(function* () {
    const { id } = yield* HttpRouter.schemaParams(Schema.Struct({ id: Schema.NumberFromString }))
    return HttpServerResponse.text(`user #${id}`) // id: number
  })
)

// `*` matches any method; `/*` matches any path — a catch-all fallback.
export const Fallback = HttpRouter.add(
  "*",
  "/*",
  HttpServerResponse.text("not found").pipe(HttpServerResponse.setStatus(404))
)
// #endregion params

// #region serve
// `HttpRouter.serve` turns an app layer (your routes) into a server layer that
// needs a platform `HttpServer`. Provide a Node http.Server bound to a port,
// then launch it. The request logger is on by default.
const App = Layer.mergeAll(Hello, ApiRoutes, GetUser, Fallback)

export const HttpLive = HttpRouter.serve(App).pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000 }))
)

NodeRuntime.runMain(Layer.launch(HttpLive))
// #endregion serve

// #region mw-builtin
// CORS is a global middleware shipped as a Layer — merge it alongside your routes
// and `serve` applies it to every request (including preflight).
export const Cors = HttpRouter.cors({
  allowedOrigins: ["https://app.example.com"],
  allowedMethods: ["GET", "POST"],
  credentials: true
})

export const AppWithCors = Layer.mergeAll(Hello, Cors)
// #endregion mw-builtin

// #region mw-custom
// Custom middleware that PROVIDES a service into every wrapped handler. Declare
// what it provides in the type param; return a function that wraps the http effect.
class RequestId extends Context.Service<RequestId, { value: string }>()("RequestId") {}

export const RequestIdLive = HttpRouter.middleware<{ provides: RequestId }>()(
  Effect.succeed((httpEffect) => Effect.provideService(httpEffect, RequestId, { value: "req-123" }))
).layer

// Handlers under it can read `RequestId` straight from context.
export const WhoAmI = HttpRouter.add(
  "GET",
  "/whoami",
  Effect.gen(function* () {
    const { value } = yield* RequestId
    return HttpServerResponse.text(value)
  })
).pipe(Layer.provide(RequestIdLive))
// #endregion mw-custom

// #region errors
// An error can render ITSELF: implement the Respondable symbol and the router
// turns a failure into your response automatically — no catch in the handler.
export class TodoNotFound extends Schema.TaggedErrorClass<TodoNotFound>()("TodoNotFound", {
  id: Schema.String
}) {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: this._tag, id: this.id }, { status: 404 })
  }
}

// Just `fail` with it. (A raw `SchemaError` becomes 400 and a missing-value
// `NoSuchElementError` becomes 404, both for free.)
export const GetTodo = HttpRouter.add(
  "GET",
  "/todos/:id",
  Effect.gen(function* () {
    const { id } = yield* HttpRouter.params
    return id === "1"
      ? HttpServerResponse.text("found")
      : yield* new TodoNotFound({ id: id ?? "" })
  })
)
// #endregion errors

// #region cookies
// Set a cookie on the way out with `setCookie` (an Effect — encoding can fail),
// and read incoming cookies off `request.cookies`.
export const Login = HttpRouter.add(
  "POST",
  "/login",
  HttpServerResponse.text("logged in").pipe(
    HttpServerResponse.setCookie("session", "tok_abc", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: "7 days"
    })
  )
)

export const readSession = (request: HttpServerRequest.HttpServerRequest) =>
  Effect.succeed(HttpServerResponse.text(request.cookies.session ?? "anon"))
// #endregion cookies

// #region client
// The same package makes OUTBOUND requests. Pull the `HttpClient` service, fire a
// request, then decode the body through a schema. `FetchHttpClient.layer` supplies
// a client backed by the platform `fetch`.
export const fetchUser = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient
  const response = yield* client.get("https://api.example.com/users/1")
  const json = yield* response.json
  return yield* Schema.decodeUnknownEffect(User)(json)
}).pipe(Effect.provide(FetchHttpClient.layer))
// #endregion client

// #region client-send
// Build a request with body + headers, transform the client (here `filterStatusOk`
// turns a non-2xx into a typed error), then `execute` it.
export const createUserRemote = Effect.gen(function* () {
  const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk)
  const request = yield* HttpClientRequest.post("https://api.example.com/users").pipe(
    HttpClientRequest.setHeader("authorization", "Bearer tok"),
    HttpClientRequest.bodyJson({ name: "Ada", email: "ada@example.com" })
  )
  const response = yield* client.execute(request)
  return yield* Schema.decodeUnknownEffect(User)(yield* response.json)
}).pipe(Effect.provide(FetchHttpClient.layer))
// #endregion client-send

// #region capstone
// Everything at once: a tiny in-memory notes service built from the primitives.
// Schemas + a self-rendering error, three routes (list / get-by-id / create), a
// typed param and body decode, CORS, then served on Node.

// 1 · data + a failure that renders itself
class Note extends Schema.Class<Note>("Note")({
  id: Schema.Number,
  text: Schema.String
}) {}

class NoteNotFound extends Schema.TaggedErrorClass<NoteNotFound>()("NoteNotFound", {
  id: Schema.Number
}) {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: this._tag, id: this.id }, { status: 404 })
  }
}

const NewNote = Schema.Struct({ text: Schema.NonEmptyString })
const notes: ReadonlyArray<Note> = [new Note({ id: 1, text: "first" })]

// 2 · routes — encode through schemas, decode params + body through schemas
const ListNotes = HttpRouter.route("GET", "/notes", HttpServerResponse.schemaJson(Schema.Array(Note))(notes))

const GetNote = HttpRouter.route(
  "GET",
  "/notes/:id",
  Effect.gen(function* () {
    const { id } = yield* HttpRouter.schemaParams(Schema.Struct({ id: Schema.NumberFromString }))
    const found = notes.find((n) => n.id === id)
    return found
      ? yield* HttpServerResponse.schemaJson(Note)(found)
      : yield* new NoteNotFound({ id })
  })
)

const AddNote = HttpRouter.route(
  "POST",
  "/notes",
  Effect.gen(function* () {
    const input = yield* HttpServerRequest.schemaBodyJson(NewNote)
    const note = new Note({ id: notes.length + 1, text: input.text })
    return yield* HttpServerResponse.schemaJson(Note)(note).pipe(
      Effect.map(HttpServerResponse.setStatus(201))
    )
  })
)

// 3 · compose the routes + CORS, then serve on Node
const NotesApp = Layer.mergeAll(HttpRouter.addAll([ListNotes, GetNote, AddNote]), HttpRouter.cors())

export const NotesHttpLive = HttpRouter.serve(NotesApp).pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000 }))
)
// #endregion capstone

// #region capstone-client
// The same package consumes it: a typed client that POSTs a note and decodes the
// created Note back through the very same schema.
export const useNotes = Effect.gen(function* () {
  const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk)
  const request = yield* HttpClientRequest.post("http://localhost:3000/notes").pipe(
    HttpClientRequest.bodyJson({ text: "from the client" })
  )
  const response = yield* client.execute(request)
  return yield* Schema.decodeUnknownEffect(Note)(yield* response.json)
}).pipe(Effect.provide(FetchHttpClient.layer))
// #endregion capstone-client

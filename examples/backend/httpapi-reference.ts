import { Context, Effect, Layer, Redacted, Schema } from "effect"
import { HttpRouter } from "effect/unstable/http"
import { NodeHttpServer } from "@effect/platform-node"
import { createServer } from "node:http"
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiMiddleware,
  HttpApiScalar,
  HttpApiSchema,
  HttpApiSecurity,
  HttpApiTest,
  OpenApi
} from "effect/unstable/httpapi"

// A single declarative contract, implemented once, then reused as a server, a
// typed client, a URL builder, an OpenAPI document, and an in-memory test rig.
// Declare (Endpoint -> Group -> Api) -> implement (Builder) -> serve / call /
// document / test. Every region below typechecks against effect@4 beta.

// #region model
// The data your API speaks. A plain schema-backed class for the success body...
export class User extends Schema.Class<User>("User")({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String
}) {}

// ...and a tagged error. `httpApiStatus` makes it render as 404 on the wire and
// lets you list it directly as an endpoint `error`.
export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  { id: Schema.String },
  { httpApiStatus: 404 }
) {}
// #endregion model

// #region endpoint-basic
// One endpoint = name + method + path + schemas. `:id` in the path is decoded
// by `params`; `success` is the response body; `error` is a declared failure.
export const getUser = HttpApiEndpoint.get("getUser", "/users/:id", {
  params: { id: Schema.String },
  success: User,
  error: UserNotFound
})
// #endregion endpoint-basic

// #region endpoint-full
// Every part of the request is an option. Fields can be a plain struct
// ({ key: Schema }) or any Schema.
export const createUser = HttpApiEndpoint.post("createUser", "/org/:orgId/users", {
  // :orgId path segment -> decoded with `params`
  params: { orgId: Schema.String },
  // ?notify=true&tags=a&tags=b  (decoded through string-tree codecs)
  query: { notify: Schema.Boolean, tags: Schema.Array(Schema.String) },
  // request headers
  headers: { "x-trace-id": Schema.String },
  // request body — JSON by default on POST/PUT/PATCH. Body payloads are a
  // Schema (struct fields are accepted for params/query/headers only).
  payload: Schema.Struct({ name: Schema.String, email: Schema.String }),
  // 201 response carrying the created user
  success: User.pipe(HttpApiSchema.status(201)),
  // declared failure — joins the endpoint's typed error surface
  error: HttpApiError.Conflict
})
// #endregion endpoint-full

// #region methods
// One constructor per HTTP method — all share the (name, path, options) shape.
// Body methods (post/put/patch) JSON-encode `payload`; no-body methods
// (get/head/options/delete) encode it as query params instead.
export const allMethods = [
  HttpApiEndpoint.get("listUsers", "/users"),
  HttpApiEndpoint.post("addUser", "/users"),
  HttpApiEndpoint.put("replaceUser", "/users/:id"),
  HttpApiEndpoint.patch("updateUser", "/users/:id"),
  HttpApiEndpoint.delete("removeUser", "/users/:id"),
  HttpApiEndpoint.head("ping", "/users"),
  HttpApiEndpoint.options("preflight", "/users")
]
// #endregion methods

// #region group
// A group bundles endpoints under one domain name. `add` is variadic (same
// name replaces); `prefix`/`middleware` only touch endpoints already added.
export const usersGroup = HttpApiGroup.make("users")
  .add(getUser, createUser)
  .prefix("/api")
  .annotate(OpenApi.Description, "User management")
// #endregion group

// #region group-toplevel
export const health = HttpApiEndpoint.get("health", "/health", {
  success: Schema.Struct({ status: Schema.String })
})

// `topLevel` groups expose endpoints directly on the client/builder root
// instead of nesting them under the group name.
export const rootGroup = HttpApiGroup.make("root", { topLevel: true }).add(health)
// #endregion group-toplevel

// #region api
// The API collects groups. Same identifier replaces; `prefix`/`middleware`
// apply to everything already present when called.
export const api = HttpApi.make("MyApi")
  .add(usersGroup)
  .add(rootGroup)
  .annotateMerge(
    OpenApi.annotations({
      title: "My API",
      version: "1.0.0",
      description: "Users service"
    })
  )
// #endregion api

// #region handlers
// `HttpApiBuilder.group` returns a Layer implementing EVERY endpoint of one
// group — leaving any unhandled is a type error. The handler receives only the
// fields the endpoint declared and returns the success value (or a raw response).
export const UsersLive = HttpApiBuilder.group(api, "users", (handlers) =>
  handlers
    .handle("getUser", ({ params }) =>
      Effect.succeed(new User({ id: params.id, name: "Ada", email: "ada@example.com" }))
    )
    .handle("createUser", ({ params, payload }) =>
      Effect.succeed(
        new User({ id: `${params.orgId}-1`, name: payload.name, email: payload.email })
      )
    )
)

export const RootLive = HttpApiBuilder.group(api, "root", (handlers) =>
  handlers.handle("health", () => Effect.succeed({ status: "ok" }))
)
// #endregion handlers

// #region serve
// `layer` registers the implemented groups (and optionally serves the raw
// OpenAPI JSON). Provide every group, then serve it like any router app.
export const ApiLive = HttpApiBuilder.layer(api, {
  openapiPath: "/openapi.json"
}).pipe(
  Layer.provide(UsersLive),
  Layer.provide(RootLive)
)

export const HttpLive = HttpRouter.serve(ApiLive).pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000 }))
)
// #endregion serve

// #region middleware
// A service the middleware injects into handlers...
export class CurrentUser extends Context.Service<CurrentUser, { id: string }>()(
  "CurrentUser"
) {}

// ...declared via the type param `provides`, with a typed `error`.
export class Authorization extends HttpApiMiddleware.Service<Authorization, {
  provides: CurrentUser
}>()("Authorization", {
  error: HttpApiError.Unauthorized
}) {}

// Implement it as a Layer: a function that wraps the endpoint effect.
export const AuthorizationLive = Layer.succeed(
  Authorization,
  (httpEffect) => Effect.provideService(httpEffect, CurrentUser, { id: "user-123" })
)
// #endregion middleware

// #region security
// Security middleware declares `security` schemes; the implementation is keyed
// by scheme name and receives the decoded credential automatically.
export class Auth extends HttpApiMiddleware.Service<Auth, {
  provides: CurrentUser
}>()("Auth", {
  security: { bearer: HttpApiSecurity.bearer },
  error: HttpApiError.Unauthorized
}) {}

export const AuthLive = Layer.succeed(Auth, {
  bearer: (httpEffect, { credential }) =>
    Effect.gen(function* () {
      const token = Redacted.value(credential)
      if (token.length === 0) {
        return yield* new HttpApiError.Unauthorized()
      }
      return yield* Effect.provideService(httpEffect, CurrentUser, { id: token })
    })
})
// #endregion security

// #region client
// The same `api` generates a fully typed client. Non-topLevel groups are
// nested; topLevel endpoints sit on the root. Requires an HttpClient.
export const program = Effect.gen(function* () {
  const client = yield* HttpApiClient.make(api, {
    baseUrl: "https://api.example.com"
  })

  const user = yield* client.users.getUser({ params: { id: "1" } })
  const ok = yield* client.health()

  return [user, ok] as const
})
// #endregion client

// #region urlbuilder
// Need only the encoded URL (no request)? `urlBuilder` mirrors the client shape
// but returns strings — params and query are encoded through the schemas.
export const url = HttpApiClient.urlBuilder(api, {
  baseUrl: "https://api.example.com"
})
export const userUrl = url.users.getUser({ params: { id: "123" } })
// => "https://api.example.com/api/users/123"
// #endregion urlbuilder

// #region docs
// Interactive docs UI (Scalar) + the raw OpenAPI 3.1 object, both from `api`.
export const DocsLive = HttpApiScalar.layer(api, {
  path: "/docs",
  scalar: { theme: "purple" }
})

export const spec = OpenApi.fromApi(api)
// #endregion docs

// #region test
// Exercise implemented groups in-memory through the real client pipeline — no
// server, no socket. Unselected groups die if called.
export const testProgram = Effect.gen(function* () {
  const client = yield* HttpApiTest.groups(api, ["users"])
  const created = yield* client.users.createUser({
    params: { orgId: "acme" },
    query: { notify: true, tags: ["beta"] },
    headers: { "x-trace-id": "t-1" },
    payload: { name: "Ada", email: "ada@example.com" }
  })
  return created
}).pipe(Effect.provide(UsersLive))
// #endregion test

// #region capstone
// Everything at once: a tiny secured Todos service. Schemas + a typed error, a
// bearer-auth middleware that injects the caller, three endpoints in one
// secured group, handlers that read the injected account, then the server with
// its docs route — the full declare → implement → serve pipeline.

// 1 · data + a typed failure
class Todo extends Schema.Class<Todo>("Todo")({
  id: Schema.String,
  title: Schema.String,
  done: Schema.Boolean
}) {}

class TodoNotFound extends Schema.TaggedErrorClass<TodoNotFound>()(
  "TodoNotFound",
  { id: Schema.String },
  { httpApiStatus: 404 }
) {}

// 2 · who is calling — provided by the auth middleware, read inside handlers
class Account extends Context.Service<Account, { userId: string }>()("Account") {}

class Authn extends HttpApiMiddleware.Service<Authn, { provides: Account }>()("Authn", {
  security: { bearer: HttpApiSecurity.bearer },
  error: HttpApiError.Unauthorized
}) {}

const AuthnLive = Layer.succeed(Authn, {
  bearer: (httpEffect, { credential }) =>
    Effect.gen(function* () {
      const token = Redacted.value(credential)
      if (token.length === 0) return yield* new HttpApiError.Unauthorized()
      return yield* Effect.provideService(httpEffect, Account, { userId: token })
    })
})

// 3 · endpoints → a secured group → the api
const listTodos = HttpApiEndpoint.get("listTodos", "/todos", {
  success: Schema.Array(Todo)
})
const addTodo = HttpApiEndpoint.post("addTodo", "/todos", {
  payload: Schema.Struct({ title: Schema.String }),
  success: Todo.pipe(HttpApiSchema.status(201))
})
const getTodo = HttpApiEndpoint.get("getTodo", "/todos/:id", {
  params: { id: Schema.String },
  success: Todo,
  error: TodoNotFound
})

const todosGroup = HttpApiGroup.make("todos")
  .add(listTodos, addTodo, getTodo)
  .middleware(Authn)
  .annotate(OpenApi.Description, "A tiny, secured todo list")

export const todosApi = HttpApi.make("TodosApi")
  .add(todosGroup)
  .annotateMerge(OpenApi.annotations({ title: "Todos", version: "1.0.0" }))

// 4 · handlers — `Account` is in scope because the middleware provides it
export const TodosLive = HttpApiBuilder.group(todosApi, "todos", (handlers) =>
  handlers
    .handle("listTodos", () =>
      Effect.gen(function* () {
        const account = yield* Account
        return [new Todo({ id: "1", title: `for ${account.userId}`, done: false })]
      })
    )
    .handle("addTodo", ({ payload }) =>
      Effect.succeed(new Todo({ id: "2", title: payload.title, done: false }))
    )
    .handle("getTodo", ({ params }) =>
      params.id === "1"
        ? Effect.succeed(new Todo({ id: "1", title: "first", done: false }))
        : Effect.fail(new TodoNotFound({ id: params.id }))
    )
)

// 5 · serve the API + interactive docs, on Node
export const TodosHttpLive = HttpRouter.serve(
  Layer.mergeAll(
    HttpApiBuilder.layer(todosApi, { openapiPath: "/openapi.json" }),
    HttpApiScalar.layer(todosApi)
  ).pipe(
    Layer.provide(TodosLive),
    Layer.provide(AuthnLive)
  )
).pipe(Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000 })))
// #endregion capstone

// #region capstone-consume
// The same `todosApi` value, consumed two ways — a typed client over HTTP, and
// an in-memory test that needs no server at all.
export const useTodos = Effect.gen(function* () {
  const client = yield* HttpApiClient.make(todosApi, {
    baseUrl: "https://api.example.com"
  })
  return yield* client.todos.addTodo({ payload: { title: "ship it" } })
})

export const todosTest = Effect.gen(function* () {
  const client = yield* HttpApiTest.groups(todosApi, ["todos"])
  return yield* client.todos.listTodos()
}).pipe(Effect.provide(Layer.provideMerge(TodosLive, AuthnLive)))
// #endregion capstone-consume

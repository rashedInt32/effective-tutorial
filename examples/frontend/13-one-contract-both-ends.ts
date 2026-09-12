import { Schema } from "effect"
import { FetchHttpClient } from "effect/unstable/http"
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi"
import { AtomHttpApi } from "effect/unstable/reactivity"

// This is what the whole site has been building toward. Lesson 07 declared an
// `HttpApi` and got a server out of it. The SAME value, imported into the
// browser, becomes reactive query and mutation atoms — the schemas, paths, and
// error types all shared. No codegen step, no OpenAPI generator, no second set
// of types that drifts from the first.

// #region contract
// The contract. In a real app this lives in a shared module that BOTH the server
// and the client import — that sharing is the entire point.
export class Todo extends Schema.Class<Todo>("Todo")({
  id: Schema.Number,
  title: Schema.NonEmptyString,
  done: Schema.Boolean
}) {}

const listTodos = HttpApiEndpoint.get("listTodos", "/todos", {
  success: Schema.Array(Todo)
})

const addTodo = HttpApiEndpoint.post("addTodo", "/todos", {
  payload: Schema.Struct({ title: Schema.NonEmptyString }),
  success: Todo
})

export const todosApi = HttpApi.make("todos").add(
  HttpApiGroup.make("todos").add(listTodos, addTodo)
)
// #endregion contract

// #region client
// `AtomHttpApi.Service` turns the contract into a client service that also knows
// how to make atoms. It needs an `HttpClient` layer — `FetchHttpClient.layer`
// anywhere `fetch` exists.
export class TodosClient extends AtomHttpApi.Service<TodosClient>()("TodosClient", {
  api: todosApi,
  httpClient: FetchHttpClient.layer,
  baseUrl: "https://api.example.com"
}) {}
// #endregion client

// #region query
// `query` names a group and an endpoint and hands back an atom. It's an
// `AsyncResult` atom like any other from Lesson 11, so `waiting` and the typed
// failure come along unchanged.
//
// `reactivityKeys` is the interesting part: it labels what this query DEPENDS
// on, so something else can invalidate it later by naming the same key.
export const todosAtom = TodosClient.query("todos", "listTodos", {
  reactivityKeys: ["todos"]
})
// #endregion query

// #region mutation
// `mutation` gives you a function-shaped atom. Passing the same
// `reactivityKeys` on the call means: when this succeeds, refresh anything
// keyed on "todos". That's the cache invalidation, and it's one array.
export const addTodoAtom = TodosClient.mutation("todos", "addTodo")

// In a component:
//
//   const add = useAtomSet(addTodoAtom)
//   add({ payload: { title }, reactivityKeys: ["todos"] })
//
// The list re-fetches itself. You never touch the query atom.
// #endregion mutation

// #region shared
// What you did NOT write, and that's the lesson:
//
//   · no request/response types — the schemas ARE the types
//   · no URL strings in the client — the endpoint knows its own path
//   · no error mapping — the declared errors are the atom's E channel
//   · no codegen, no build step, no generated client to keep in sync
//
// Rename a field in `Todo` and the server, the client, and every component
// stop compiling together. That's the payoff of one contract.
// #endregion shared

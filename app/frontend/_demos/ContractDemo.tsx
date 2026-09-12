"use client"

import { useState } from "react"
import { Effect, Layer, Schema } from "effect"
import { HttpBody, HttpClient, HttpClientResponse } from "effect/unstable/http"
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi"
import { AsyncResult, AtomHttpApi } from "effect/unstable/reactivity"
import { useAtomSet, useAtomValue } from "@effect/atom-react"
import { Demo, DemoButton, DemoControls, DemoOutput } from "./Demo"

/* ── the contract, exactly as in the lesson ─────────────────────────── */

class Todo extends Schema.Class<Todo>("Todo")({
  id: Schema.Number,
  title: Schema.NonEmptyString,
  done: Schema.Boolean
}) {}

const todosApi = HttpApi.make("todos").add(
  HttpApiGroup.make("todos").add(
    HttpApiEndpoint.get("listTodos", "/todos", { success: Schema.Array(Todo) }),
    HttpApiEndpoint.post("addTodo", "/todos", {
      payload: Schema.Struct({ title: Schema.NonEmptyString }),
      success: Todo
    })
  )
)

/* ── an in-memory transport ─────────────────────────────────────────────
   A real `HttpClient`, but one that answers from an array instead of the
   network. Requests still travel through the contract's schemas in both
   directions, so this demo exercises the same encode/decode path a live
   server would — it just skips the wire. */

const store: Array<{ id: number; title: string; done: boolean }> = [
  { id: 1, title: "Read the backend half", done: true },
  { id: 2, title: "Try atoms", done: false }
]
let nextId = 3
const log: Array<string> = []

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  })

/** A JSON request body arrives as a `Uint8Array` variant; decode it back. */
const readJson = (body: HttpBody.HttpBody): unknown =>
  body._tag === "Uint8Array"
    ? JSON.parse(new TextDecoder().decode(body.body))
    : {}

const InMemoryHttpClient = Layer.succeed(
  HttpClient.HttpClient,
  HttpClient.make((request, url) =>
    Effect.map(Effect.sleep("450 millis"), () => {
      log.unshift(`${request.method} ${url.pathname}`)

      if (request.method === "POST") {
        const { title } = readJson(request.body) as { title: string }
        const created = { id: nextId++, title, done: false }
        store.push(created)
        return HttpClientResponse.fromWeb(request, respond(created))
      }

      return HttpClientResponse.fromWeb(request, respond(store))
    })
  )
)

class TodosClient extends AtomHttpApi.Service<TodosClient>()("TodosClient", {
  api: todosApi,
  httpClient: InMemoryHttpClient,
  baseUrl: "https://demo.local"
}) {}

/* ── the atoms: one query, one mutation, sharing a reactivity key ───── */

const todosAtom = TodosClient.query("todos", "listTodos", {
  reactivityKeys: ["todos"]
})
const addTodoAtom = TodosClient.mutation("todos", "addTodo")

function Todos() {
  const result = useAtomValue(todosAtom)
  const add = useAtomSet(addTodoAtom)
  const [draft, setDraft] = useState("Ship the frontend half")

  const rows = AsyncResult.getOrElse(result, () => [] as ReadonlyArray<Todo>)

  return (
    <>
      <DemoControls>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-border bg-black/20 px-3 py-1.5 text-sm font-mono text-foreground outline-none focus:border-cyan/40"
          aria-label="New todo title"
        />
        <DemoButton
          onClick={() => {
            if (draft.trim().length === 0) return
            add({ payload: { title: draft.trim() }, reactivityKeys: ["todos"] })
          }}
          disabled={draft.trim().length === 0}
        >
          add
        </DemoButton>
      </DemoControls>

      <DemoOutput>
        <div className="flex flex-col gap-1">
          {rows.length === 0 && <span className="text-muted">loading…</span>}
          {rows.map((t) => (
            <span key={t.id} className={result.waiting ? "text-muted/50" : "text-cyan"}>
              <span className="text-muted">#{t.id}</span> {t.title}
              {t.done && <span className="ml-2 text-xs text-muted">done</span>}
            </span>
          ))}
        </div>
      </DemoOutput>

      <p className="mt-3 text-xs font-mono text-muted">
        {log.length === 0 ? "no requests yet" : `requests: ${log.slice(0, 3).join(" · ")}`}
      </p>
      <p className="mt-2 text-xs text-muted">
        Adding one fires <span className="font-mono">POST /todos</span>, then the
        list re-fetches itself — both share the key{" "}
        <span className="font-mono">&quot;todos&quot;</span>.
      </p>
    </>
  )
}

export function ContractDemo() {
  return (
    <Demo label="Todos.tsx">
      <Todos />
    </Demo>
  )
}

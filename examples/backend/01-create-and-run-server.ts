import { Effect, Layer } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { createServer } from "node:http"

// The same handler, written three ways. All three produce the exact same
// Effect<HttpServerResponse> — pick the style that reads best for the job.

// #region handler-gen
// `Effect.gen` — imperative, sequential. Best when there are several steps.
export const helloGen = Effect.gen(function* () {
  yield* Effect.log("→ GET /")
  return HttpServerResponse.text("Hello from Effect!")
})
// #endregion handler-gen

// #region handler-fn
// `Effect.fn` — a named, traced handler that receives the request. The name
// ("hello") shows up in stack traces and telemetry spans.
export const helloFn = Effect.fn("hello")(function* (request: HttpServerRequest.HttpServerRequest) {
  yield* Effect.log(`→ ${request.method} ${request.url}`)
  return HttpServerResponse.text("Hello from Effect!")
})
// #endregion handler-fn

// #region handler-pipe
// `pipe` composition — point-free. Best for short one-liners with no branching.
export const helloPipe = Effect.log("→ GET /").pipe(
  Effect.as(HttpServerResponse.text("Hello from Effect!"))
)
// #endregion handler-pipe

// #region route
// A route is a Layer that registers one handler with the router.
const HelloRoute = HttpRouter.add("GET", "/", helloGen)
// #endregion route

// #region server-node
// Node: build the server layer, provide a Node http.Server bound to a port,
// then launch it as the program's main effect.
const NodeServerLive = HttpRouter.serve(HelloRoute).pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000 }))
)

NodeRuntime.runMain(Layer.launch(NodeServerLive))
// #endregion server-node

// #region server-bun
// Bun: identical app layer — only the platform layer + runtime change.
// No `createServer`; Bun.serve handles the socket.
const BunServerLive = HttpRouter.serve(HelloRoute).pipe(
  Layer.provide(BunHttpServer.layer({ port: 3000 }))
)

BunRuntime.runMain(Layer.launch(BunServerLive))
// #endregion server-bun

import { Context, Effect, Layer, Redacted, Schema } from "effect"
import { HttpRouter } from "effect/unstable/http"
import { NodeHttpServer } from "@effect/platform-node"
import { createServer } from "node:http"
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiMiddleware,
  HttpApiSecurity
} from "effect/unstable/httpapi"

// Most endpoints shouldn't run for just anyone. In Effect an HttpApi middleware
// answers the question once, declaratively: it reads a credential, turns it into
// a typed "who is calling" service, and fails with a 401 when the credential is
// missing or bad — so every protected handler simply ASKS for the caller and
// trusts it. Authentication (who are you) and authorization (may you do this)
// stay separate.

// #region scheme
// Two pieces. `HttpApiSecurity.bearer` describes the credential: an
// `Authorization: Bearer <token>` header, decoded for you as a `Redacted` so the
// token never lands in a log or stack trace. `CurrentUser` is the service the
// middleware will PROVIDE to handlers once it has verified that token.
export class CurrentUser extends Context.Service<CurrentUser, {
  readonly id: string
  readonly roles: ReadonlyArray<string>
}>()("app/CurrentUser") {}

// #endregion scheme

// #region middleware
// `HttpApiMiddleware.Service` declares the contract: which `security` scheme it
// reads, what it `provides` to handlers, and the typed `error` it fails with.
// `Unauthorized` already carries a 401 on the wire — no status to set by hand.
export class Authn extends HttpApiMiddleware.Service<Authn, {
  provides: CurrentUser
}>()("app/Authn", {
  security: { bearer: HttpApiSecurity.bearer },
  error: HttpApiError.Unauthorized
}) {}
// #endregion middleware

// #region implement
// The implementation is a `Layer` keyed by scheme name. It receives the decoded
// `credential` and either PROVIDES `CurrentUser` to the wrapped handler or fails
// with 401 — and that one failure rejects every protected route at the door.
export const AuthnLive = Layer.succeed(Authn, {
  bearer: (httpEffect, { credential }) =>
    Effect.gen(function* () {
      // `credential` is Redacted: unwrap ONLY to verify, never to log.
      const token = Redacted.value(credential)
      // PLACEHOLDER. Real code must verify before trusting — a JWT signature
      // check or a session lookup — and treat any failure as Unauthorized.
      const user = verifyToken(token)
      if (user === null) return yield* new HttpApiError.Unauthorized()
      return yield* Effect.provideService(httpEffect, CurrentUser, user)
    })
})

// Stand-in for real verification (JWT verify / session store).
const verifyToken = (
  token: string
): { id: string; roles: ReadonlyArray<string> } | null =>
  token === "admin-token"
    ? { id: "user-1", roles: ["admin"] }
    : token === "alice-token"
      ? { id: "user-2", roles: [] }
      : null
// #endregion implement

// #region protect
// Attach the middleware to a GROUP and every endpoint in it is protected at
// once. The endpoints declare their own failures too: `Forbidden` (403) is for
// an authenticated caller who isn't ALLOWED — distinct from 401.
const Document = Schema.Struct({ id: Schema.String, ownerId: Schema.String })

const getDocument = HttpApiEndpoint.get("getDocument", "/documents/:id", {
  params: { id: Schema.String },
  success: Document,
  error: [HttpApiError.NotFound, HttpApiError.Forbidden]
})

const deleteDocument = HttpApiEndpoint.delete("deleteDocument", "/documents/:id", {
  params: { id: Schema.String },
  success: Schema.Void,
  error: [HttpApiError.NotFound, HttpApiError.Forbidden]
})

export const documents = HttpApiGroup.make("documents")
  .add(getDocument, deleteDocument)
  .middleware(Authn) // <- one line guards the whole group

export const api = HttpApi.make("DocsApi").add(documents)
// #endregion protect

// #region authorize
// Because the middleware ran first, handlers just `yield* CurrentUser` — no
// header parsing here. Authentication is done; now do AUTHORIZATION: check this
// caller may touch THIS resource. Owning it, or being an admin, is allowed;
// anything else is a 403. Never assume that a valid token implies access.
const docs = new Map<string, { id: string; ownerId: string }>([
  ["d1", { id: "d1", ownerId: "user-2" }]
])

export const DocumentsLive = HttpApiBuilder.group(api, "documents", (handlers) =>
  handlers
    .handle("getDocument", ({ params }) =>
      Effect.gen(function* () {
        const user = yield* CurrentUser
        const doc = docs.get(params.id)
        if (doc === undefined) return yield* new HttpApiError.NotFound()
        if (doc.ownerId !== user.id && !user.roles.includes("admin")) {
          return yield* new HttpApiError.Forbidden()
        }
        return doc
      })
    )
    .handle("deleteDocument", ({ params }) =>
      Effect.gen(function* () {
        const user = yield* CurrentUser
        const doc = docs.get(params.id)
        if (doc === undefined) return yield* new HttpApiError.NotFound()
        if (doc.ownerId !== user.id && !user.roles.includes("admin")) {
          return yield* new HttpApiError.Forbidden()
        }
        docs.delete(params.id)
      })
    )
)
// #endregion authorize

// #region serve
// Wire it up: the API layer, the group handlers, and the auth implementation.
// The middleware's requirement is satisfied once, here at the edge — provide a
// different `AuthnLive` in a test and every route is authenticated by
// the double instead, with no handler changing.
export const HttpLive = HttpRouter.serve(
  HttpApiBuilder.layer(api).pipe(
    Layer.provide(DocumentsLive),
    Layer.provide(AuthnLive)
  )
).pipe(Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000 })))
// #endregion serve

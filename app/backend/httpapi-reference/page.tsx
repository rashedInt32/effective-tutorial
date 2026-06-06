import Link from "next/link"
import type { Metadata } from "next"
import { highlight, loadRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Reveal } from "@/app/_components/Reveal"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "HttpApi — the whole map · Effect backend",
  description:
    "A single declarative contract, reused as a server, a typed client, a URL builder, OpenAPI docs, and an in-memory test rig. Every option of effect/unstable/httpapi, on one page."
}

const FILE = "backend/httpapi-reference.ts"

/* Illustrative menus — reference enumerations, not a runnable program, so they
   live inline (the same way the other lessons inline their curl snippets). */
const IMPORTS = `import { Effect, Schema, Layer, Context, Redacted } from "effect"
import {
  HttpApi, HttpApiGroup, HttpApiEndpoint, HttpApiBuilder,
  HttpApiSchema, HttpApiError, HttpApiMiddleware, HttpApiSecurity,
  HttpApiClient, HttpApiTest, OpenApi, HttpApiScalar, HttpApiSwagger
} from "effect/unstable/httpapi"`

const ENCODINGS = `schema.pipe(HttpApiSchema.status(201))         // a number...
schema.pipe(HttpApiSchema.status("Created"))   // ...or a named literal

HttpApiSchema.NoContent   // void @ 204  (the default success)
HttpApiSchema.Created     // void @ 201
HttpApiSchema.Accepted    // void @ 202
HttpApiSchema.Empty(204)  // void @ any status

schema.pipe(HttpApiSchema.asJson())             // default
schema.pipe(HttpApiSchema.asFormUrlEncoded())   // encoded side: record of strings
schema.pipe(HttpApiSchema.asText())             // encoded side: string
schema.pipe(HttpApiSchema.asUint8Array())       // encoded side: Uint8Array
schema.pipe(HttpApiSchema.asMultipart())        // buffered upload (payload only)
schema.pipe(HttpApiSchema.asMultipartStream())  // payload becomes Stream<Part>
schema.pipe(HttpApiSchema.asNoContent({ decode: () => value })) // empty wire, typed value`

const ERRORS = `HttpApiError.BadRequest          // 400     HttpApiError.NotFound           // 404
HttpApiError.Unauthorized        // 401     HttpApiError.MethodNotAllowed   // 405
HttpApiError.Forbidden           // 403     HttpApiError.Conflict           // 409
HttpApiError.Gone                // 410     HttpApiError.NotImplemented     // 501
HttpApiError.InternalServerError // 500     HttpApiError.ServiceUnavailable // 503
// ...each also has a *NoContent variant (decodes an empty body into the error)`

const ATTACH = `endpoint.middleware(Authorization)   // one route
group.middleware(Authorization)      // every route already in the group
api.middleware(Authorization)        // every route already in the api`

const SCHEMES = `HttpApiSecurity.bearer                                     // -> Redacted<string>
HttpApiSecurity.basic                                      // -> { username, password: Redacted }
HttpApiSecurity.apiKey({ key: "x-api-key", in: "header" }) // in: "header" | "query" | "cookie"`

const RESPONSE_MODE = `client.users.getUser({ params })                                       // decoded value (default)
client.users.getUser({ params, responseMode: "decoded-and-response" }) // [value, response]
client.users.getUser({ params, responseMode: "response-only" })        // raw response, no decode`

const OPENAPI = `api.annotateMerge(OpenApi.annotations({
  title, version, description, license, summary, servers,
  externalDocs, deprecated, format, override, exclude, transform
}))

endpoint.annotate(OpenApi.Summary, "Create a user")
endpoint.annotate(OpenApi.Identifier, "customOperationId")
group.annotate(OpenApi.Exclude, true)              // omit from the spec
api.annotate(HttpApi.AdditionalSchemas, [Named])   // extra component schemas`

export default async function Page() {
  const r = loadRegions(FILE)

  const [
    importsHtml,
    modelHtml,
    endpointBasicHtml,
    endpointFullHtml,
    methodsHtml,
    encodingsHtml,
    errorsHtml,
    groupHtml,
    groupTopHtml,
    apiHtml,
    handlersHtml,
    serveHtml,
    middlewareHtml,
    attachHtml,
    securityHtml,
    schemesHtml,
    clientHtml,
    responseModeHtml,
    urlbuilderHtml,
    openapiHtml,
    docsHtml,
    testHtml,
    capstoneHtml,
    capstoneConsumeHtml
  ] = await Promise.all([
    highlight(IMPORTS, "ts"),
    highlight(r.model, "ts"),
    highlight(r["endpoint-basic"], "ts"),
    highlight(r["endpoint-full"], "ts"),
    highlight(r.methods, "ts"),
    highlight(ENCODINGS, "ts"),
    highlight(ERRORS, "ts"),
    highlight(r.group, "ts"),
    highlight(r["group-toplevel"], "ts"),
    highlight(r.api, "ts"),
    highlight(r.handlers, "ts"),
    highlight(r.serve, "ts"),
    highlight(r.middleware, "ts"),
    highlight(ATTACH, "ts"),
    highlight(r.security, "ts"),
    highlight(SCHEMES, "ts"),
    highlight(r.client, "ts"),
    highlight(RESPONSE_MODE, "ts"),
    highlight(r.urlbuilder, "ts"),
    highlight(OPENAPI, "ts"),
    highlight(r.docs, "ts"),
    highlight(r.test, "ts"),
    highlight(r.capstone, "ts"),
    highlight(r["capstone-consume"], "ts")
  ])

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Reveal>
        <Link
          href="/"
          className="text-sm font-mono text-muted hover:text-foreground transition-colors"
        >
          ← all lessons
        </Link>
        <p className="mt-8 text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">
          Backend · Reference
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
          HttpApi — <span className="text-gradient">the whole map</span>
        </h1>
        <p className="mt-5 text-lg text-muted leading-relaxed">
          The other lessons wire routes by hand. <Code>httpapi</Code> goes one
          level up: you <em>declare</em> the contract once, and that single
          value becomes a server, a typed client, a URL builder, an OpenAPI
          document, and an in-memory test rig. This page is the entire surface —
          every option, in the order you&apos;d reach for it.
        </p>
        <Quote label="The shape of everything">
          <strong className="text-foreground">Declare</strong> (Endpoint → Group
          → Api) → <strong className="text-foreground">implement</strong>{" "}
          (Builder) → <span className="text-cyan">serve</span> ·{" "}
          <span className="text-cyan">call</span> ·{" "}
          <span className="text-cyan">document</span> ·{" "}
          <span className="text-cyan">test</span>. Every code block below
          typechecks against <Code>effect@4</Code>.
        </Quote>
      </Reveal>

      {/* Imports */}
      <Section n="00" title="What you import">
        <p className="prose-text">
          Two sources only: data types and combinators from <Code>effect</Code>,
          and the API modules from <Code>effect/unstable/httpapi</Code>.
        </p>
        <CodeFrame
          html={importsHtml}
          code={IMPORTS}
          filename="imports.ts"
          lang="ts"
        />
      </Section>

      {/* 01 — model */}
      <Section n="01" title="Model the data and the failures">
        <p className="prose-text">
          Everything downstream is driven by schemas. A success body is just a{" "}
          <Code>Schema.Class</Code>; a typed error is a tagged error whose{" "}
          <Code>httpApiStatus</Code> picks the response code and lets you list
          it directly as an endpoint <Code>error</Code>.
        </p>
        <CodeFrame
          html={modelHtml}
          code={r.model}
          filename="model.ts"
          lang="ts"
        />
      </Section>

      {/* 02 — endpoints */}
      <Section n="02" title="Declare an endpoint">
        <p className="prose-text">
          An endpoint couples a name + method + path with schemas for each part
          of the exchange. <Code>:id</Code> in the path is decoded by{" "}
          <Code>params</Code>; <Code>success</Code> is the response;{" "}
          <Code>error</Code> is a declared failure.
        </p>
        <CodeFrame
          html={endpointBasicHtml}
          code={r["endpoint-basic"]}
          filename="endpoints.ts"
          lang="ts"
        />
        <p className="prose-text">
          Fill in as much as the route needs — params, query, headers, payload,
          success, and error are all optional. Plain struct objects work for
          params / query / headers; the body <Code>payload</Code> takes a{" "}
          <Code>Schema</Code>.
        </p>
        <CodeFrame
          html={endpointFullHtml}
          code={r["endpoint-full"]}
          filename="endpoints.ts"
          lang="ts"
        />
        <Callout label="Call shape">
          It&apos;s a single call — <Code>get(name, path, options)</Code>, not a
          curried builder. Body methods JSON-encode <Code>payload</Code>;
          no-body methods encode it as query params instead.
        </Callout>
        <CodeFrame
          html={methodsHtml}
          code={r.methods}
          filename="endpoints.ts"
          lang="ts"
        />
      </Section>

      {/* 03 — schema metadata */}
      <Section n="03" title="Status codes & body encodings">
        <p className="prose-text">
          <Code>HttpApiSchema</Code> annotates a schema with how it travels:
          which status, which content type, which body shape. Unset, it defaults
          to JSON.
        </p>
        <CodeFrame
          html={encodingsHtml}
          code={ENCODINGS}
          filename="HttpApiSchema"
          lang="ts"
        />
        <Quote label="Defaults worth memorizing">
          Success without a status is <Code>200</Code>; an error without one is{" "}
          <Code>500</Code>; a body without an encoding is{" "}
          <span className="text-violet">JSON</span>. Multipart is{" "}
          <strong className="text-foreground">payload-only</strong> — a
          multipart response is rejected.
        </Quote>
      </Section>

      {/* 04 — errors */}
      <Section n="04" title="Built-in errors">
        <p className="prose-text">
          Ready-made tagged errors carrying the right status. Use them as{" "}
          <Code>error</Code> schemas or return them straight from a handler.
        </p>
        <CodeFrame
          html={errorsHtml}
          code={ERRORS}
          filename="HttpApiError"
          lang="ts"
        />
        <ModuleNote module="HttpApiError">
          Request decoding failures surface as <Code>HttpApiSchemaError</Code>{" "}
          (responds <Code>400</Code>, with a <Code>kind</Code> of{" "}
          <Code>Params | Headers | Query | Body | Payload</Code>) — catch and
          reshape it with middleware if you want a custom envelope.
        </ModuleNote>
      </Section>

      {/* 05 — groups */}
      <Section n="05" title="Bundle endpoints into groups">
        <p className="prose-text">
          A group is a domain boundary — a set of endpoints under one name, with
          shared prefix, middleware, and annotations.
        </p>
        <CodeFrame
          html={groupHtml}
          code={r.group}
          filename="groups.ts"
          lang="ts"
        />
        <Callout label="Order matters">
          <Code>prefix</Code>, <Code>middleware</Code>, and the{" "}
          <Code>annotateEndpoints</Code> helpers only touch endpoints{" "}
          <em>already added</em> when you call them. Adding an endpoint with an
          existing name replaces it.
        </Callout>
        <p className="prose-text">
          A <Code>topLevel</Code> group lifts its endpoints onto the
          client/builder root instead of nesting them under the group name.
        </p>
        <CodeFrame
          html={groupTopHtml}
          code={r["group-toplevel"]}
          filename="groups.ts"
          lang="ts"
        />
      </Section>

      {/* 06 — api */}
      <Section n="06" title="Compose the API">
        <p className="prose-text">
          <Code>HttpApi.make</Code> collects groups into one contract. This is
          the value every consumer below is built from.
        </p>
        <CodeFrame html={apiHtml} code={r.api} filename="api.ts" lang="ts" />
        <ModuleNote module="HttpApi">
          <Code>addHttpApi</Code> merges another API&apos;s groups,{" "}
          <Code>prefix</Code> / <Code>middleware</Code> apply to everything
          present when called, and <Code>annotate</Code> /{" "}
          <Code>annotateMerge</Code> attach OpenAPI metadata.
        </ModuleNote>
      </Section>

      {/* 07 — implement */}
      <Section n="07" title="Implement the handlers">
        <p className="prose-text">
          <Code>HttpApiBuilder.group</Code> returns a <Code>Layer</Code> that
          implements one group. The handler gets only the fields the endpoint
          declared and returns the success value — or an{" "}
          <Code>HttpServerResponse</Code> to bypass encoding.
        </p>
        <CodeFrame
          html={handlersHtml}
          code={r.handlers}
          filename="handlers.ts"
          lang="ts"
        />
        <Quote label="The compiler holds you to it">
          Leaving any endpoint of the group unimplemented is a{" "}
          <strong className="text-foreground">type error</strong>, not a runtime
          surprise. Use <Code>handleRaw</Code> to opt out of payload decoding
          and read the request body yourself.
        </Quote>
      </Section>

      {/* 08 — serve */}
      <Section n="08" title="Register & serve">
        <p className="prose-text">
          <Code>HttpApiBuilder.layer</Code> mounts the implemented groups onto
          the router (and can publish the raw OpenAPI JSON). Provide every
          group, then serve it exactly like a hand-written router app.
        </p>
        <CodeFrame
          html={serveHtml}
          code={r.serve}
          filename="server.ts"
          lang="ts"
        />
        <Callout label="Miss one?">
          If a group isn&apos;t provided before <Code>layer</Code> evaluates, it
          fails loudly with a defect naming the missing group — never a silent
          404.
        </Callout>
      </Section>

      {/* 09 — middleware */}
      <Section n="09" title="Cross-cutting middleware">
        <p className="prose-text">
          A middleware is a service that wraps endpoint execution. Its type
          params declare what it <Code>provides</Code> into handlers and
          requires; its options declare a typed <Code>error</Code>.
        </p>
        <CodeFrame
          html={middlewareHtml}
          code={r.middleware}
          filename="middleware.ts"
          lang="ts"
        />
        <p className="prose-text">Attach it at any altitude:</p>
        <CodeFrame
          html={attachHtml}
          code={ATTACH}
          filename="middleware.ts"
          lang="ts"
        />
        <ModuleNote module="HttpApiMiddleware">
          <Code>layerSchemaErrorTransform</Code> turns <Code>400</Code> decode
          failures into your own error; <Code>layerClient</Code> supplies the
          matching client-side middleware when one is{" "}
          <Code>requiredForClient</Code>.
        </ModuleNote>
      </Section>

      {/* 10 — security */}
      <Section n="10" title="Security schemes">
        <p className="prose-text">
          Security is middleware whose <Code>security</Code> declares schemes.
          The implementation is keyed by scheme name and receives the decoded
          credential automatically — no manual header parsing.
        </p>
        <CodeFrame
          html={securityHtml}
          code={r.security}
          filename="security.ts"
          lang="ts"
        />
        <p className="prose-text">
          Three schemes, each handing you a typed credential:
        </p>
        <CodeFrame
          html={schemesHtml}
          code={SCHEMES}
          filename="HttpApiSecurity"
          lang="ts"
        />
        <ModuleNote module="HttpApiBuilder">
          Multiple schemes in one middleware are tried in order until one
          succeeds. Set an API-key cookie from a handler with{" "}
          <Code>securitySetCookie</Code>.
        </ModuleNote>
      </Section>

      {/* 11 — client */}
      <Section n="11" title="The typed client">
        <p className="prose-text">
          The same <Code>api</Code> generates a client whose calls encode
          requests and decode responses through the very same schemas.
          Non-topLevel groups nest; topLevel endpoints sit on the root.
        </p>
        <CodeFrame
          html={clientHtml}
          code={r.client}
          filename="client.ts"
          lang="ts"
        />
        <p className="prose-text">
          A per-call <Code>responseMode</Code> chooses what comes back:
        </p>
        <CodeFrame
          html={responseModeHtml}
          code={RESPONSE_MODE}
          filename="client.ts"
          lang="ts"
        />
        <p className="prose-text">
          Need only the URL? <Code>urlBuilder</Code> mirrors the client shape
          but returns strings.
        </p>
        <CodeFrame
          html={urlbuilderHtml}
          code={r.urlbuilder}
          filename="client.ts"
          lang="ts"
        />
        <ModuleNote module="HttpApiClient">
          <Code>makeWith</Code> takes your own <Code>HttpClient</Code>;{" "}
          <Code>group</Code> and <Code>endpoint</Code> build just one slice when
          you don&apos;t want the whole client.
        </ModuleNote>
      </Section>

      {/* 12 — docs */}
      <Section n="12" title="OpenAPI & docs UI">
        <p className="prose-text">
          The contract is already a document. <Code>OpenApi.fromApi</Code> emits
          OpenAPI 3.1; <Code>HttpApiScalar</Code> / <Code>HttpApiSwagger</Code>{" "}
          mount a browsable UI.
        </p>
        <CodeFrame html={docsHtml} code={r.docs} filename="docs.ts" lang="ts" />
        <p className="prose-text">Shape the document with annotations:</p>
        <CodeFrame
          html={openapiHtml}
          code={OPENAPI}
          filename="OpenApi"
          lang="ts"
        />
        <ModuleNote module="HttpApiScalar / HttpApiSwagger">
          <Code>HttpApiScalar.layerCdn</Code> loads Scalar from jsDelivr;{" "}
          <Code>HttpApiSwagger.layer(api, &#123; path &#125;)</Code> serves
          Swagger UI. Both default the mount path to <Code>/docs</Code>.
        </ModuleNote>
      </Section>

      {/* 13 — testing */}
      <Section n="13" title="Test without a server">
        <p className="prose-text">
          <Code>HttpApiTest.groups</Code> runs selected groups in memory through
          the real encode → route → decode pipeline. No socket, no port — just
          the typed client against your handlers.
        </p>
        <CodeFrame
          html={testHtml}
          code={r.test}
          filename="api.test.ts"
          lang="ts"
        />
        <Quote label="One contract, five payoffs">
          Endpoint → Group → Api gives you the server, the client, the URL
          builder, the OpenAPI doc, and the test rig — all from the same value,
          all kept honest by the same schemas.
        </Quote>
      </Section>

      {/* Capstone */}
      <section className="mt-28">
        <Reveal>
          <p className="text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">
            Putting it together
          </p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-gradient">One small service</span>, every
            piece
          </h2>
          <p className="mt-4 prose-text">
            A tiny secured Todos API that exercises almost everything above at
            once — schemas and a typed error, a bearer-auth middleware that
            injects the caller, three endpoints in one secured group, handlers
            that read the injected account, then the server with its docs route.
            It&apos;s the whole <Code>declare → implement → serve</Code> arc in
            one file, and it typechecks.
          </p>
        </Reveal>
        <div className="mt-8 space-y-5">
          <CodeFrame
            html={capstoneHtml}
            code={r.capstone}
            filename="todos.ts"
            lang="ts"
          />
          <p className="prose-text">
            And because it&apos;s the same <Code>todosApi</Code> value,
            consuming it is free — a typed client over HTTP, and an in-memory
            test that never opens a socket:
          </p>
          <CodeFrame
            html={capstoneConsumeHtml}
            code={r["capstone-consume"]}
            filename="todos.consume.ts"
            lang="ts"
          />
          <Quote label="That's the whole point">
            You wrote the contract once. The server, the{" "}
            <span className="text-cyan">client</span>, the{" "}
            <span className="text-cyan">docs</span>, and the{" "}
            <span className="text-cyan">test</span> all fell out of it — and the
            same schemas keep every one of them honest.
          </Quote>
        </div>
      </section>

      {/* Back */}
      <div className="mt-28 border-t border-border pt-10">
        <Link href="/" className="text-sm text-cyan hover:underline">
          ← back to all lessons
        </Link>
      </div>
    </main>
  )
}

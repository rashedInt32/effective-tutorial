import Link from "next/link"
import type { Metadata } from "next"
import { highlightAll, highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Reveal } from "@/app/_components/Reveal"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "http — the whole map · Effect backend",
  description:
    "The low-level server toolkit under effect/unstable/http: request, response, router, middleware, errors, cookies, and the outbound client — every piece you reach for to build a server by hand."
}

const FILE = "backend/http-reference.ts"

/* Hand-curated reference menus — enumerations, not a runnable program, so they
   live inline (the same way the other lessons inline their curl snippets).
   Unlike the numbered examples below, these are hand-written, not lifted from
   the typechecked source file. */
const IMPORTS = `import { Context, Effect, Layer, Schema } from "effect"
import {
  HttpRouter, HttpServerRequest, HttpServerResponse, HttpServerRespondable,
  HttpMiddleware, HttpServerError, Headers, Cookies,
  HttpClient, HttpClientRequest, HttpClientResponse, FetchHttpClient
} from "effect/unstable/http"
// the platform binding that owns the socket:
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"`

const READING = `request.method          // "GET" | "POST" | ...
request.url             // "/users?page=2"
request.headers         // Headers — lowercased keys
request.cookies         // Record<string, string>
request.remoteAddress   // Option<string>

request.text            // Effect<string, HttpServerError>
request.json            // Effect<unknown, HttpServerError>
request.arrayBuffer     // Effect<ArrayBuffer, HttpServerError>
request.stream          // Stream<Uint8Array, HttpServerError>

HttpServerRequest.schemaBodyJson(schema)      // typed JSON body
HttpServerRequest.schemaSearchParams(schema)  // typed ?query=...
HttpServerRequest.schemaHeaders(schema)       // typed headers
HttpServerRequest.schemaBodyForm(schema)      // multipart / urlencoded form`

const CONSTRUCTORS = `HttpServerResponse.text("hi")              // text/plain
HttpServerResponse.json(value)             // Effect — encoding can fail
HttpServerResponse.jsonUnsafe(value)       // sync — throws on bad input
HttpServerResponse.html("<h1>hi</h1>")     // text/html
HttpServerResponse.empty()                 // 204 No Content
HttpServerResponse.redirect("/login")      // 302
HttpServerResponse.uint8Array(bytes)       // binary
HttpServerResponse.stream(byteStream)      // streamed body
HttpServerResponse.schemaJson(schema)(v)   // encode THROUGH a schema

// combinators (immutable, chain in a pipe):
.pipe(HttpServerResponse.setStatus(201, "Created"))
.pipe(HttpServerResponse.setHeader("x-id", "abc"))
.pipe(HttpServerResponse.setHeaders({ "cache-control": "no-store" }))
.pipe(HttpServerResponse.setCookie("session", token, { httpOnly: true }))`

const METHODS = `HttpRouter.add("GET",    "/users",      handler)   // register one route (a Layer)
HttpRouter.add("POST",   "/users",      handler)
HttpRouter.add("PUT",    "/users/:id",  handler)
HttpRouter.add("PATCH",  "/users/:id",  handler)
HttpRouter.add("DELETE", "/users/:id",  handler)
HttpRouter.add("*",      "/*",          handler)   // any method · catch-all path

HttpRouter.route(method, path, handler)            // build a Route value...
HttpRouter.addAll([routeA, routeB])                // ...then batch-register them`

const CLIENT_TRANSFORMS = `client.pipe(HttpClient.filterStatusOk)                  // non-2xx -> typed error
client.pipe(HttpClient.retry(Schedule.exponential("100 millis")))
client.pipe(HttpClient.followRedirects(5))
client.pipe(HttpClient.mapRequest(HttpClientRequest.setHeader("x-key", "v")))
client.pipe(HttpClient.tap((res) => Effect.log(res.status)))

HttpClientResponse.schemaJson(schema)   // decode status + headers + body
response.json   // Effect<unknown>      response.text   // Effect<string>`

export default async function Page() {
  // File-backed snippets — every one is lifted from a region that typechecks.
  const snip = await highlightRegions(FILE, [
    "model",
    "handler",
    "request",
    "req-schema",
    "response",
    "response-mods",
    "router",
    "params",
    "serve",
    "mw-builtin",
    "mw-custom",
    "errors",
    "cookies",
    "client",
    "client-send",
    "capstone",
    "capstone-client"
  ])
  // Hand-curated reference menus — shown code === copied code.
  const menu = await highlightAll({
    imports: { code: IMPORTS },
    reading: { code: READING },
    constructors: { code: CONSTRUCTORS },
    methods: { code: METHODS },
    clientTransforms: { code: CLIENT_TRANSFORMS }
  })

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Backend · Reference"
        title={<>http — <span className="text-gradient">the whole map</span></>}
        intro={
          <>
            <Code>httpapi</Code> declares a contract and derives everything from
            it. <Code>http</Code> is the layer underneath — the pieces you wire by
            hand when you want full control: read the <em>request</em>, build a{" "}
            <em>response</em>, register <em>routes</em> on a router, wrap them in{" "}
            <em>middleware</em>, then <span className="text-cyan">serve</span>.
            This page is that toolkit, in the order you&apos;d reach for it.
          </>
        }
      >
        <Quote label="The shape of everything">
          <span className="text-cyan">request</span> →{" "}
          <strong className="text-foreground">handler</strong> →{" "}
          <span className="text-cyan">response</span>, registered on a{" "}
          <strong className="text-foreground">router</strong>, wrapped in{" "}
          <strong className="text-foreground">middleware</strong>, handed to a{" "}
          <span className="text-cyan">platform server</span>. Every numbered
          example below is lifted straight from a source file that typechecks
          against <Code>effect@4</Code>; the reference menus between them are
          hand-curated.
        </Quote>
      </Hero>

      {/* Imports */}
      <Section n="00" title="What you import">
        <p className="prose-text">
          One module namespace per concern, all from{" "}
          <Code>effect/unstable/http</Code> — plus a platform binding (Node or
          Bun) that actually owns the socket.
        </p>
        <CodeFrame {...menu.imports} filename="imports.ts" lang="ts" />
      </Section>

      {/* 01 — handler */}
      <Section n="01" title="The handler is just an Effect">
        <p className="prose-text">
          There&apos;s no special handler type. A handler is any Effect that
          yields an <Code>HttpServerResponse</Code> — and the router accepts it
          as a bare value, an Effect, or a function of the request.
        </p>
        <CodeFrame {...snip.handler} filename="handler.ts" lang="ts" />
      </Section>

      {/* 02 — request */}
      <Section n="02" title="Read the request">
        <p className="prose-text">
          <Code>HttpServerRequest</Code> is a service carrying the live request.
          Its fields are plain values; its body accessors are Effects, because a
          read or parse can fail.
        </p>
        <CodeFrame {...snip.request} filename="request.ts" lang="ts" />
        <p className="prose-text">
          Decode any part of the request <em>through a schema</em> to get typed,
          validated input — a malformed request fails with a{" "}
          <Code>SchemaError</Code> instead of reaching your logic.
        </p>
        <CodeFrame {...snip["req-schema"]} filename="request.ts" lang="ts" />
        <CodeFrame {...menu.reading} filename="HttpServerRequest" lang="ts" />
      </Section>

      {/* 03 — response */}
      <Section n="03" title="Build the response">
        <p className="prose-text">
          Constructors for the common bodies. The JSON pair is the one to
          remember: <Code>json</Code> returns an Effect (encoding can fail), while{" "}
          <Code>jsonUnsafe</Code> is synchronous and throws.
        </p>
        <CodeFrame {...snip.response} filename="response.ts" lang="ts" />
        <p className="prose-text">
          Combinators layer on immutably, so they chain in a pipe.{" "}
          <Code>schemaJson</Code> encodes a value through a schema first — dates
          become ISO strings, brands survive, omitted fields can&apos;t leak.
        </p>
        <CodeFrame {...snip["response-mods"]} filename="response.ts" lang="ts" />
        <CodeFrame {...menu.constructors} filename="HttpServerResponse" lang="ts" />
        <Quote label="Defaults worth memorizing">
          A fresh response is <Code>200</Code>; <Code>empty()</Code> is{" "}
          <Code>204</Code>; <Code>redirect</Code> is <Code>302</Code>;{" "}
          <Code>json</Code> sets <span className="text-violet">application/json</span>{" "}
          for you. Body methods never mutate — each returns a new response.
        </Quote>
      </Section>

      {/* 04 — router */}
      <Section n="04" title="Register routes on a router">
        <p className="prose-text">
          A route binds a method + path to a handler. <Code>add</Code> registers
          one route as a <Code>Layer</Code>; <Code>route</Code> builds a value and{" "}
          <Code>addAll</Code> batches several. Mounting the same path twice — last
          one wins.
        </p>
        <CodeFrame {...snip.router} filename="router.ts" lang="ts" />
        <CodeFrame {...menu.methods} filename="HttpRouter" lang="ts" />
      </Section>

      {/* 05 — params */}
      <Section n="05" title="Path parameters">
        <p className="prose-text">
          A <Code>:name</Code> segment is captured. Read the raw record with{" "}
          <Code>HttpRouter.params</Code>, or decode it through a schema with{" "}
          <Code>schemaParams</Code> for typed values — the router provides the
          param context automatically, so neither leaks into your requirements.
        </p>
        <CodeFrame {...snip.params} filename="params.ts" lang="ts" />
        <ModuleNote module="HttpRouter">
          <Code>schemaJson</Code> decodes the whole request (method, url, headers,
          cookies, path + search params, and JSON body) into one value;{" "}
          <Code>schemaNoBody</Code> does the same without reading the body.
        </ModuleNote>
      </Section>

      {/* 06 — serve */}
      <Section n="06" title="Register & serve">
        <p className="prose-text">
          <Code>HttpRouter.serve</Code> turns your routes into a server layer that
          still needs a platform <Code>HttpServer</Code>. Provide one — a Node{" "}
          <Code>http.Server</Code> on a port — then launch it. Swap{" "}
          <Code>NodeHttpServer</Code> for <Code>BunHttpServer</Code> and nothing
          else changes.
        </p>
        <CodeFrame {...snip.serve} filename="server.ts" lang="ts" />
        <Callout label="Logger included">
          The request logger is on by default — pass{" "}
          <Code>serve(app, &#123; disableLogger: true &#125;)</Code> to silence it,
          or <Code>Layer.provide(HttpRouter.disableLogger)</Code> on a single
          route.
        </Callout>
      </Section>

      {/* 07 — middleware */}
      <Section n="07" title="Middleware">
        <p className="prose-text">
          Built-in middleware ships as Layers. <Code>HttpRouter.cors</Code> is
          global — merge it next to your routes and every request (preflight
          included) is handled.
        </p>
        <CodeFrame {...snip["mw-builtin"]} filename="middleware.ts" lang="ts" />
        <p className="prose-text">
          Custom middleware can <em>provide a service</em> into every handler it
          wraps — declare what it provides, return a function that wraps the http
          effect, then <Code>Layer.provide</Code> it onto the routes that need it.
        </p>
        <CodeFrame {...snip["mw-custom"]} filename="middleware.ts" lang="ts" />
        <ModuleNote module="HttpMiddleware">
          <Code>logger</Code>, <Code>tracer</Code>,{" "}
          <Code>xForwardedHeaders</Code>, and <Code>searchParamsParser</Code> are
          ready-made wrappers; <Code>HttpMiddleware.make</Code> lifts a plain
          wrapping function into one.
        </ModuleNote>
      </Section>

      {/* 08 — errors */}
      <Section n="08" title="Errors that render themselves">
        <p className="prose-text">
          A handler can simply <Code>fail</Code> with a typed error. If that error
          implements the <Code>HttpServerRespondable</Code> symbol, the router
          turns it into your response — no <Code>catch</Code> in the handler.
        </p>
        <CodeFrame {...snip.errors} filename="errors.ts" lang="ts" />
        <ModuleNote module="HttpServerError">
          Failures the router already knows: a <Code>SchemaError</Code> becomes{" "}
          <Code>400</Code>, a <Code>NoSuchElementError</Code> becomes{" "}
          <Code>404</Code>, and anything unrecognized becomes a clean{" "}
          <Code>500</Code> — never an unhandled crash.
        </ModuleNote>
      </Section>

      {/* 09 — cookies */}
      <Section n="09" title="Cookies">
        <p className="prose-text">
          Set a cookie on the way out with <Code>setCookie</Code> — an Effect,
          since the value is validated and encoded — and read incoming cookies
          straight off <Code>request.cookies</Code>.
        </p>
        <CodeFrame {...snip.cookies} filename="cookies.ts" lang="ts" />
        <ModuleNote module="Cookies / Headers">
          The <Code>Cookies</Code> and <Code>Headers</Code> modules back these:{" "}
          <Code>Cookies.makeCookie</Code> validates one off to the side, and{" "}
          <Code>Headers.redact</Code> hides secrets (<Code>authorization</Code>,{" "}
          <Code>cookie</Code>, …) from your logs.
        </ModuleNote>
      </Section>

      {/* 10 — client */}
      <Section n="10" title="The outbound client">
        <p className="prose-text">
          The same package makes requests <em>out</em>. Pull the{" "}
          <Code>HttpClient</Code> service, fire a request, decode the body through
          a schema. <Code>FetchHttpClient.layer</Code> supplies a client backed by
          the platform <Code>fetch</Code>.
        </p>
        <CodeFrame {...snip.client} filename="client.ts" lang="ts" />
        <p className="prose-text">
          Build a request with a body and headers, transform the client, then{" "}
          <Code>execute</Code>. Transforms compose — filter, retry, redirect,
          rewrite — and apply to every call the client makes.
        </p>
        <CodeFrame {...snip["client-send"]} filename="client.ts" lang="ts" />
        <CodeFrame {...menu.clientTransforms} filename="HttpClient" lang="ts" />
      </Section>

      {/* Capstone */}
      <section className="mt-28">
        <Reveal>
          <p className="text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">
            Putting it together
          </p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-gradient">One small service</span>, every piece
          </h2>
          <p className="mt-4 prose-text">
            A tiny in-memory notes service built from the primitives: a schema and
            a self-rendering error, three routes that list, fetch-by-id, and
            create, with a typed param and body decode, CORS, then served on Node.
            It&apos;s the whole <Code>request → handler → response</Code> pipeline
            in one file, and it typechecks.
          </p>
        </Reveal>
        <div className="mt-8 space-y-5">
          <CodeFrame {...snip.capstone} filename="notes.ts" lang="ts" />
          <p className="prose-text">
            And because the schemas are shared, consuming it is symmetric — a
            typed client that POSTs a note and decodes the created{" "}
            <Code>Note</Code> back through the very same schema:
          </p>
          <CodeFrame {...snip["capstone-client"]} filename="notes.consume.ts" lang="ts" />
          <Quote label="One layer down">
            <Code>httpapi</Code> hands you all of this from a single declaration.
            When you need to drop below it — a custom router, hand-rolled
            middleware, a response the contract can&apos;t express — this is the
            toolkit it was built from.
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

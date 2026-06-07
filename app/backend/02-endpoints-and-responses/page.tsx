import Link from "next/link"
import type { Metadata } from "next"
import { highlight, highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Reveal } from "@/app/_components/Reveal"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { ScrollStack, type StackItem } from "@/app/_components/ScrollStack"
import { Section, Callout, ModuleNote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "02 · Endpoints & responses — Effect backend",
  description: "Return JSON, set status codes and headers, and read the request body with Effect v4."
}

const FILE = "backend/02-endpoints-and-responses.ts"

export default async function Lesson() {
  // File-backed snippets (shown code === copied code, kept honest by typecheck).
  const snip = await highlightRegions(FILE, [
    "json",
    "body-json",
    "body-unsafe",
    "body-schema",
    "status",
    "headers",
    "read-body",
    "routes"
  ])
  // Terminal snippets show an annotated command but copy only the bare command.
  const [getCurlHtml, echoCurlHtml] = await Promise.all([
    highlight("curl localhost:3000/user\n# → {\"id\":1,\"name\":\"Ada Lovelace\",\"admin\":true}", "bash"),
    highlight("curl -X POST localhost:3000/echo -d '{\"hi\":true}'\n# → {\"youSent\":{\"hi\":true}}", "bash")
  ])

  const stack: StackItem[] = [
    {
      id: "json",
      badge: "json",
      title: "Safe — the default",
      ...snip["body-json"],
      filename: "responses.ts",
      desc: "Returns Effect<HttpServerResponse, HttpBodyError>. Serialization failures land in the error channel, so a bad body can never silently ship as a 200. Reach for this unless you have a reason not to."
    },
    {
      id: "unsafe",
      badge: "jsonUnsafe",
      title: "Synchronous — no Effect",
      ...snip["body-unsafe"],
      filename: "responses.ts",
      desc: "Plain HttpServerResponse, no error channel. JSON.stringify throws on failure instead of failing the Effect. Use only when the body is provably serializable. Adjacent: text, html, empty."
    },
    {
      id: "schema",
      badge: "schemaJson",
      title: "Encoded through a Schema",
      ...snip["body-schema"],
      filename: "responses.ts",
      desc: "Validate and transform before serializing — Date → ISO string, branded types, redacted fields. Returns a reusable encoder you can apply to many values. This is the bridge into Lesson 03."
    }
  ]

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Backend · Lesson 02"
        title={<>Endpoints <span className="text-gradient">&amp; responses</span></>}
        intro={
          <>
            Lesson 01 replied with plain text. Real endpoints send JSON, choose a
            status, set headers, and read what the client sent. Each is its own
            small question — let&apos;s walk them.
          </>
        }
      />

      {/* Q1 — JSON */}
      <Section n="Q1" title="How do I send JSON back?">
        <p className="prose-text">
          <Code>HttpServerResponse.json(...)</Code> serializes with{" "}
          <Code>JSON.stringify</Code>. Because that can fail, it hands you an{" "}
          <strong>Effect</strong>, not a bare response — so your handler simply{" "}
          <em>is</em> that Effect.
        </p>
        <CodeFrame {...snip.json} filename="responses.ts" lang="ts" />
        <Callout label="Why an Effect?">
          Serialization can blow up (a <Code>BigInt</Code>, a circular object).{" "}
          <Code>json</Code> captures that as <Code>HttpBodyError</Code> in the
          error channel, so a malformed body can never silently become a{" "}
          <Code>200</Code>. The synchronous escape hatch is{" "}
          <Code>jsonUnsafe</Code> — next.
        </Callout>
        <CodeFrame html={getCurlHtml} code="curl localhost:3000/user" filename="terminal" lang="bash" />
      </Section>

      {/* Q2 — JSON three ways (STACK) */}
      <section className="mt-28">
        <Reveal>
          <p className="text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">
            Q2 · the same JSON, three ways
          </p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-gradient">json, jsonUnsafe, or schemaJson?</span>
          </h2>
          <p className="mt-4 prose-text">
            They differ only in how much safety you want between your value and the
            wire. Scroll — each option stacks over the last.
          </p>
        </Reveal>
        <div className="mt-10">
          <ScrollStack items={stack} />
        </div>
      </section>

      {/* Q3 — status */}
      <Section n="Q3" title="How do I set the status code?">
        <p className="prose-text">
          Two ways: pass <Code>status</Code> in the options object when you build
          the response, or layer <Code>setStatus</Code> onto an existing one.
        </p>
        <CodeFrame {...snip.status} filename="responses.ts" lang="ts" />
        <Callout label="Defaults">
          Body constructors default to <Code>200</Code>, <Code>empty</Code> to{" "}
          <Code>204</Code>, and <Code>redirect</Code> to <Code>302</Code>. You only
          reach for <Code>setStatus</Code> when you want something else.
        </Callout>
      </Section>

      {/* Q4 — headers */}
      <Section n="Q4" title="How do I set response headers?">
        <p className="prose-text">
          <Code>setHeader</Code> sets one, <Code>setHeaders</Code> merges several.
          Every response is immutable, so each returns a new one and they chain in
          a <Code>pipe</Code>.
        </p>
        <CodeFrame {...snip.headers} filename="responses.ts" lang="ts" />
        <ModuleNote module="HttpServerResponse">
          <Code>setBody</Code> swaps the body, <Code>setCookie</Code> /{" "}
          <Code>expireCookie</Code> manage cookies (in the error channel —{" "}
          encoding can fail), <Code>redirect</Code> builds a{" "}
          <Code>Location</Code> response, and <Code>empty</Code> /{" "}
          <Code>uint8Array</Code> / <Code>stream</Code> / <Code>file</Code> cover
          non-JSON bodies.
        </ModuleNote>
      </Section>

      {/* Q5 — read the body */}
      <Section n="Q5" title="How do I read the request body?">
        <p className="prose-text">
          A handler can be a <strong>function of the request</strong>. Reading the
          body is effectful — <Code>request.json</Code> can fail to read or parse —
          so you <Code>yield*</Code> it like any other Effect.
        </p>
        <CodeFrame {...snip["read-body"]} filename="responses.ts" lang="ts" />
        <CodeFrame html={echoCurlHtml} code="curl -X POST localhost:3000/echo -d '{&quot;hi&quot;:true}'" filename="terminal" lang="bash" />
        <ModuleNote module="HttpServerRequest">
          Raw accessors <Code>text</Code>, <Code>urlParamsBody</Code>,{" "}
          <Code>arrayBuffer</Code>, <Code>stream</Code>; and schema-decoding
          helpers <Code>schemaBodyJson</Code>, <Code>schemaHeaders</Code>,{" "}
          <Code>schemaSearchParams</Code>, <Code>schemaBodyForm</Code> — those
          validate as they read, which is exactly Lesson 03.
        </ModuleNote>
      </Section>

      {/* Q6 — register */}
      <Section n="Q6" title="How do I register these endpoints?">
        <p className="prose-text">
          <Code>route</Code> builds a route value; <Code>addAll</Code> turns the
          list into the router Layer. Serve it exactly as in{" "}
          <Link href="/backend/01-create-and-run-server" className="text-cyan hover:underline">
            Lesson 01
          </Link>
          .
        </p>
        <CodeFrame {...snip.routes} filename="routes.ts" lang="ts" />
      </Section>

      {/* Next */}
      <LessonNav currentSlug="02-endpoints-and-responses" />
    </main>
  )
}

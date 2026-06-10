import Link from "next/link"
import type { Metadata } from "next"
import { highlight, highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { ScrollStack, type StackItem } from "@/app/_components/ScrollStack"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"
import { lessonBySlug } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "03 · Schemas: payload, response & errors — Effect backend",
  description:
    "Validate untrusted input, model failures as typed data, and encode responses through a Schema with Effect v4."
}

const FILE = "backend/03-schemas.ts"
const LESSON = lessonBySlug("03-schemas")

export default async function Lesson() {
  // File-backed snippets (shown code === copied code, kept honest by typecheck).
  const snip = await highlightRegions(FILE, [
    "model",
    "payload",
    "decode",
    "parts-body",
    "parts-query",
    "parts-headers",
    "invalid",
    "errors",
    "handle-errors",
    "encode",
    "routes"
  ])
  // Terminal snippets show an annotated command but copy only the bare command.
  const [createCurlHtml, invalidCurlHtml] = await Promise.all([
    highlight(
      'curl -X POST localhost:3000/users \\\n  -d \'{"name":"Ada Lovelace","email":"ada@example.com","age":36}\'\n# → 200 {"id":1,"name":"Ada Lovelace","email":"ada@example.com","age":36,"createdAt":"2026-06-07T…Z"}',
      "bash"
    ),
    highlight(
      'curl -X POST localhost:3000/users -d \'{"name":"","email":"nope","age":999}\'\n# → 400 {"error":"ValidationFailed","detail":"…"}',
      "bash"
    )
  ])

  const stack: StackItem[] = [
    {
      id: "body",
      badge: "schemaBodyJson",
      title: "The JSON body",
      ...snip["parts-body"],
      filename: "decode.ts",
      desc: "POST/PUT/PATCH bodies. Reads and decodes in one step; the value is fully typed and a malformed body fails with SchemaError. Adjacent: schemaBodyUrlParams, schemaBodyForm, schemaBodyMultipart."
    },
    {
      id: "query",
      badge: "schemaSearchParams",
      title: "The query string",
      ...snip["parts-query"],
      filename: "decode.ts",
      desc: "?role=admin&tags=a&tags=b — search params arrive string-keyed, with repeats as arrays, and decode straight into your struct. Literals and arrays map cleanly because their wire form is already a string."
    },
    {
      id: "headers",
      badge: "schemaHeaders",
      title: "The headers",
      ...snip["parts-headers"],
      filename: "decode.ts",
      desc: "Required headers, validated like everything else — a missing key is a SchemaError, not an undefined you forgot to check. Adjacent: schemaCookies."
    }
  ]

  return (
    <>
      {/* Hero */}
      <Hero
        eyebrow={`Backend · Lesson ${LESSON.n}`}
        title={<>Schemas: <span className="text-gradient">payload, response &amp; errors</span></>}
        intro={
          <>
            Lesson 02 sent JSON and name-dropped the schema decoders. Here&apos;s the
            payoff: one <Code>Schema</Code> validates what comes in, models what can
            go wrong, and encodes what goes out — so untrusted input becomes typed
            data at the door, and never leaks past it.
          </>
        }
      />

      {/* Q1 — model */}
      <Section n="Q1" title="How do I describe the shape of my data?">
        <p className="prose-text">
          A schema is a single declaration that gives you a TypeScript type, a
          runtime validator, and a JSON codec at once. <Code>.check(...)</Code>{" "}
          adds constraints; <Code>Schema.brand</Code> makes a value{" "}
          <em>unmixable</em> with a plain string of the same shape.
        </p>
        <CodeFrame {...snip.model} filename="model.ts" lang="ts" />
        <Callout label="Rich domain types">
          A branded, checked <Code>Email</Code> can&apos;t be confused with any
          other string, and an out-of-range <Code>age</Code> can&apos;t be
          constructed. The meaning lives in the type — the compiler and the runtime
          agree on it.
        </Callout>
        <p className="prose-text">
          The body you accept from a client is its own schema — usually a{" "}
          <em>subset</em> of the success model. The server owns <Code>id</Code> and{" "}
          <Code>createdAt</Code>, so the payload simply omits them.
        </p>
        <CodeFrame {...snip.payload} filename="model.ts" lang="ts" />
        <ModuleNote module="Schema">
          <Code>Struct</Code> / <Code>Class</Code> for records, <Code>Union</Code> /{" "}
          <Code>Literals</Code> for variants, <Code>Array</Code> /{" "}
          <Code>Record</Code> for collections, <Code>brand</Code> +{" "}
          <Code>check</Code> (<Code>isMinLength</Code>, <Code>isBetween</Code>,{" "}
          <Code>isPattern</Code>) for constraints, and ready-mades like{" "}
          <Code>NonEmptyString</Code>, <Code>Int</Code>, <Code>Date</Code>.
        </ModuleNote>
      </Section>

      {/* Q2 — validate body */}
      <Section n="Q2" title="How do I validate what the client sent?">
        <p className="prose-text">
          <Code>HttpServerRequest.schemaBodyJson(schema)</Code> reads the body{" "}
          <strong>and</strong> decodes it in one step. The success value is fully
          typed; a body that doesn&apos;t fit never reaches your logic.
        </p>
        <CodeFrame {...snip.decode} filename="decode.ts" lang="ts" />
        <Callout label="Failure is in the type">
          Decoding returns <Code>Effect&lt;CreateUser, SchemaError&gt;</Code>. The{" "}
          <Code>SchemaError</Code> sits in the error channel, so an invalid body is
          a value you handle — never an exception that escapes. (Effect v4 fails
          with <Code>SchemaError</Code>, not the older <Code>ParseError</Code>.)
        </Callout>
        <CodeFrame
          html={createCurlHtml}
          code={"curl -X POST localhost:3000/users -d '{\"name\":\"Ada Lovelace\",\"email\":\"ada@example.com\",\"age\":36}'"}
          filename="terminal"
          lang="bash"
        />
      </Section>

      {/* Q3 — every part, decoded (STACK) */}
      <Section
        n="Q3 · same decode, every source"
        title={<span className="text-gradient">body, query, or headers?</span>}
        after={
          <div className="mt-10">
            <ScrollStack items={stack} />
          </div>
        }
      >
        <p className="prose-text">
          Every part of the request decodes through a schema the same way — only
          the source changes. Scroll — each source stacks over the last.
        </p>
      </Section>

      {/* Q4 — invalid */}
      <Section n="Q4" title="What happens when the input is invalid?">
        <p className="prose-text">
          You decide. A <Code>SchemaError</Code> is data, so catch it by its tag
          and shape one clean response — the single place where untrusted input
          turns into a <Code>400</Code>.
        </p>
        <CodeFrame {...snip.invalid} filename="handlers.ts" lang="ts" />
        <Quote label="Parse, don't validate">
          Validation throws a value away after checking it; <em>parsing</em> turns
          it into a more precise type you can&apos;t misuse downstream. Decoding at
          the boundary means the rest of your handler only ever sees{" "}
          <span className="text-cyan">valid, typed</span> data.
        </Quote>
        <CodeFrame
          html={invalidCurlHtml}
          code={"curl -X POST localhost:3000/users -d '{\"name\":\"\",\"email\":\"nope\",\"age\":999}'"}
          filename="terminal"
          lang="bash"
        />
      </Section>

      {/* Q5 — model errors */}
      <Section n="Q5" title="How do I model my own failures?">
        <p className="prose-text">
          Domain errors are schemas too — <Code>TaggedErrorClass</Code> gives each
          one a <Code>_tag</Code>, typed fields, and serializability. List them in
          a function&apos;s error channel and the compiler tracks every one.
        </p>
        <CodeFrame {...snip.errors} filename="errors.ts" lang="ts" />
        <p className="prose-text">
          Then map each tag to its status. Because the error surface is typed,
          missing a case is a <strong>compile error</strong>, not a stray{" "}
          <Code>500</Code>.
        </p>
        <CodeFrame {...snip["handle-errors"]} filename="handlers.ts" lang="ts" />
        <ModuleNote module="Effect">
          <Code>catchTag</Code> handles one tag, <Code>catchTags</Code> a record of
          them, <Code>catchCause</Code> reaches the full cause (defects, interrupts),
          and <Code>catchIf</Code> / <Code>catchFilter</Code> recover by predicate.
          Tagged errors are also <em>yieldable</em> — usable directly in a generator
          with <Code>yield*</Code>.
        </ModuleNote>
      </Section>

      {/* Q6 — encode response */}
      <Section n="Q6" title="How do I encode the response safely?">
        <p className="prose-text">
          <Code>HttpServerResponse.schemaJson(schema)</Code> encodes your value{" "}
          <em>through</em> the schema before serializing — so the wire shape is
          exactly what the schema says, and anything it omits can never leak.
        </p>
        <CodeFrame {...snip.encode} filename="responses.ts" lang="ts" />
        <Callout label="The schema is the contract">
          A <Code>Date</Code> becomes an ISO string, a branded field keeps its
          meaning, and a field you left out of the schema is invisible on the wire —
          encoding and decoding are the same contract read in two directions.
        </Callout>
        <ModuleNote module="Schema / HttpServerResponse">
          Wrap a secret in <Code>Schema.Redacted</Code> to keep it out of logs and
          responses; drop to <Code>jsonUnsafe</Code> (no schema, no error channel)
          only when the value is provably encodable.
        </ModuleNote>
      </Section>

      {/* Q7 — register */}
      <Section n="Q7" title="How do I register & serve these?">
        <p className="prose-text">
          Nothing new here: <Code>route</Code> builds a value, <Code>addAll</Code>{" "}
          turns the list into the router Layer, and you serve it exactly as in{" "}
          <Link href="/backend/01-create-and-run-server" className="text-cyan hover:underline">
            Lesson 01
          </Link>
          .
        </p>
        <CodeFrame {...snip.routes} filename="routes.ts" lang="ts" />
      </Section>

      {/* Level up → reference */}
      <div className="mt-28 border-t border-border pt-10">
        <p className="text-sm text-muted">Level up →</p>
        <Link
          href="/backend/httpapi-reference"
          className="mt-2 inline-block text-xl font-semibold text-foreground hover:text-cyan transition-colors"
        >
          ★ HttpApi — declare this whole contract once, get the server, client,
          docs &amp; tests →
        </Link>
      </div>

      {/* Next (renders nothing once this is the last sequential lesson) */}
      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

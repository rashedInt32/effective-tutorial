import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Config — Effect reference",
  description:
    "Typed, composable configuration in Effect: declare values with Config.string/port/redacted, combine with Config.all/nested, and read by yielding — missing values fail with a ConfigError."
}

const FILE = "reference/config.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["declare", "compose", "read"])

  return (
    <>
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Config</>}
        intro={
          <>
            Configuration as a typed, composable value. A <Code>Config&lt;A&gt;</Code>{" "}
            describes <em>where</em> a value comes from and <em>how</em> to parse
            it — and because a Config is itself an <Code>Effect</Code>, you read it
            by yielding, with missing or invalid values failing as a typed{" "}
            <Code>ConfigError</Code>.
          </>
        }
      >
        <Quote label="No more process.env.X!">
          Configuration becomes part of the type system: the compiler knows the
          shape, the runtime validates it at startup, and a missing variable is a{" "}
          <span className="text-cyan">handled failure</span>, not a 3am{" "}
          <Code>undefined</Code>.
        </Quote>
      </Hero>

      {/* Declare */}
      <Section n="01" title="Declare what you need">
        <p className="prose-text">
          Each primitive reads one named value and parses it to a type —{" "}
          <Code>string</Code>, <Code>number</Code>, <Code>port</Code>,{" "}
          <Code>boolean</Code>, and more. <Code>withDefault</Code> makes one
          optional; <Code>redacted</Code> wraps a secret so it never prints.
        </p>
        <CodeFrame {...snip.declare} filename="config.ts" lang="ts" />
        <Callout label="Secrets stay secret">
          <Code>Config.redacted</Code> yields a <Code>Redacted&lt;string&gt;</Code>{" "}
          — its value is hidden from logs, stack traces, and accidental{" "}
          <Code>console.log</Code>s until you explicitly unwrap it.
        </Callout>
      </Section>

      {/* Compose */}
      <Section n="02" title="Compose & nest">
        <p className="prose-text">
          <Code>Config.all</Code> combines several configs into one structured
          value; <Code>nested</Code> scopes a group under a prefix, so a shared
          shape can read <Code>DB_HOST</Code>, <Code>DB_PORT</Code>, and friends.
        </p>
        <CodeFrame {...snip.compose} filename="config.ts" lang="ts" />
        <Callout label="Configs compose like the values they produce">
          Build small configs and assemble them — the same way you build small
          effects and combine them. A whole app&apos;s configuration is just one{" "}
          <Code>Config</Code> of a nested record.
        </Callout>
      </Section>

      {/* Read */}
      <Section n="03" title="Read it">
        <p className="prose-text">
          A <Code>Config</Code> is an <Code>Effect</Code>, so you read it with{" "}
          <Code>yield*</Code> like anything else. Provide the values at the edge and
          validation happens once, at startup.
        </p>
        <CodeFrame {...snip.read} filename="config.ts" lang="ts" />
        <Quote label="One source, validated once">
          Because reading config is an <Code>Effect</Code> failing with{" "}
          <Code>ConfigError</Code>, you handle a bad environment with the same{" "}
          <Link href="/reference/errors" className="text-cyan hover:underline">
            recovery combinators
          </Link>{" "}
          as everything else.
        </Quote>
        <ModuleNote module="Config / ConfigProvider">
          More primitives: <Code>int</Code>, <Code>boolean</Code>,{" "}
          <Code>literal</Code>, <Code>duration</Code>, <Code>url</Code>,{" "}
          <Code>date</Code>. Combinators: <Code>option</Code>, <Code>map</Code>,{" "}
          <Code>orElse</Code>, and <Code>Config.schema</Code> to parse through a{" "}
          <Link href="/backend/03-schemas" className="text-cyan hover:underline">
            Schema
          </Link>
          . Where values come from is a <Code>ConfigProvider</Code> (env by
          default — swap in files or a custom source).
        </ModuleNote>
      </Section>
    </>
  )
}

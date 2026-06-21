import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Schema — the whole map — Effect reference",
  description:
    "Schema is one value that is at once a TS type, a decoder (unknown → typed), an encoder (typed → wire), and a constructor. Compose structs, add runtime checks, transform between shapes, brand, and unite."
}

const FILE = "reference/schema.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, [
    "struct",
    "decode",
    "check",
    "transform",
    "brand",
    "class",
    "union"
  ])

  return (
    <>
      <Hero
        eyebrow="Reference · the whole map"
        title={<>Schema — the <span className="text-gradient">whole map</span></>}
        intro={
          <>
            <Link href="/backend/03-schemas" className="text-cyan hover:underline">
              Lesson 03
            </Link>{" "}
            used Schema at the HTTP boundary. Here is the whole map. A{" "}
            <Code>Schema</Code> is <em>one value</em> that is at once a TS type, a{" "}
            decoder (<Code>unknown</Code> → typed), an encoder (typed → wire), and
            a constructor — so the shape, the validator, and the type can never
            drift apart.
          </>
        }
      >
        <Quote label="One value, four jobs">
          Declare the shape once and you get the static type, runtime validation,
          serialization, and a constructor — all in sync, because they&apos;re all{" "}
          <span className="text-cyan">the same value</span>.
        </Quote>
      </Hero>

      {/* Struct */}
      <Section n="01" title="Compose a struct">
        <p className="prose-text">
          Build up from primitives. <Code>Struct</Code> combines fields,{" "}
          <Code>optionalKey</Code> makes one optional, <Code>Array</Code> nests.
          The schema is also the source of the static type — read it back with{" "}
          <Code>Schema.Schema.Type</Code>, so the type follows the validator
          automatically.
        </p>
        <CodeFrame {...snip.struct} filename="schema.ts" lang="ts" />
      </Section>

      {/* Decode */}
      <Section n="02" title="Decode & encode">
        <p className="prose-text">
          One schema runs both directions, in two error styles.{" "}
          <Code>decodeUnknownSync</Code> throws a <Code>SchemaError</Code> on bad
          input; <Code>decodeUnknownEffect</Code> returns that failure as data in
          the Effect&apos;s error channel; <Code>encodeUnknownSync</Code> runs it
          backwards — typed value to the plain wire shape.
        </p>
        <CodeFrame {...snip.decode} filename="schema.ts" lang="ts" />
        <Callout label="Decode at the edge, trust within">
          Once <Code>unknown</Code> input has decoded, the rest of your program
          works in fully typed values — validation happens once, at the boundary,
          not as scattered defensive checks.
        </Callout>
      </Section>

      {/* Check */}
      <Section n="03" title="Add runtime checks">
        <p className="prose-text">
          A <Code>.check(...)</Code> attaches a constraint without changing the
          type — the value still has to pass to decode. Constructors are{" "}
          <Code>Schema.is*</Code>; compose several and all must hold. Meaning lives
          in the schema, not in scattered <Code>if</Code> guards.
        </p>
        <CodeFrame {...snip.check} filename="schema.ts" lang="ts" />
        <ModuleNote module="Schema">
          A deep catalog of checks: <Code>isMinLength</Code>,{" "}
          <Code>isPattern</Code>, <Code>isGreaterThan</Code>, <Code>isBetween</Code>,{" "}
          <Code>isUUID</Code>, <Code>isInt</Code>. Each takes optional annotations
          (including a custom <Code>message</Code>) for the failure.
        </ModuleNote>
      </Section>

      {/* Transform */}
      <Section n="04" title="Transform between shapes">
        <p className="prose-text">
          The encoded and decoded shapes can differ. <Code>decodeTo</Code> bridges
          them with a pair of getters: <Code>decode</Code> maps the source in,{" "}
          <Code>encode</Code> reverses it out. The wire carries a string; your code
          works with a number — losslessly, both ways.
        </p>
        <CodeFrame {...snip.transform} filename="schema.ts" lang="ts" />
        <Quote label="Parse, don't validate">
          A transform doesn&apos;t just check the input — it produces a richer
          value (a <Code>Date</Code>, a number, a domain type). The unsafe shape
          can&apos;t survive past the boundary.
        </Quote>
      </Section>

      {/* Brand */}
      <Section n="05" title="Brand for nominal types">
        <p className="prose-text">
          Two <Code>string</Code>s with the same shape can still mean different
          things. <Code>brand</Code> makes a nominal type: a <Code>UserId</Code>{" "}
          is no longer assignable from a plain string, so you can&apos;t pass an
          order id where a user id is wanted. <Code>.make</Code> builds one.
        </p>
        <CodeFrame {...snip.brand} filename="schema.ts" lang="ts" />
      </Section>

      {/* Class */}
      <Section n="06" title="Classes & tagged errors">
        <p className="prose-text">
          <Code>Schema.Class</Code> is one declaration that yields a constructor, a
          TS type, and an encoder/decoder at once. <Code>TaggedErrorClass</Code>{" "}
          does the same for a failure — a <Code>_tag</Code> for matching, plus the
          data its handler needs.
        </p>
        <CodeFrame {...snip.class} filename="schema.ts" lang="ts" />
        <ModuleNote module="Schema">
          Classes are extensible — add methods and getters to the class body, and
          they ride along with the decoded instance. See{" "}
          <Link href="/reference/data-match" className="text-cyan hover:underline">
            Data &amp; Match
          </Link>{" "}
          for matching on the result.
        </ModuleNote>
      </Section>

      {/* Union */}
      <Section n="07" title="Unions & discriminated unions">
        <p className="prose-text">
          <Code>Union</Code> is &ldquo;one of these&rdquo;. With{" "}
          <Code>TaggedStruct</Code>, each member carries a literal <Code>_tag</Code>,
          so decode picks the right member by its tag and a <Code>switch</Code> on{" "}
          <Code>_tag</Code> stays exhaustive. <Code>Literals</Code> is the shorthand
          for a string-enum.
        </p>
        <CodeFrame {...snip.union} filename="schema.ts" lang="ts" />
        <Quote label="The shape is the contract">
          A discriminated union encodes your domain&apos;s alternatives as data.
          Decode rejects anything that isn&apos;t one of them, and the compiler
          forces every handler to cover every case.
        </Quote>
      </Section>
    </>
  )
}

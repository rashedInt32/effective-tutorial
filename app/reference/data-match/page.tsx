import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Data & Match — Effect reference",
  description:
    "Immutable values with structural equality (Data.Class, Equal.equals), tagged unions (Data.taggedEnum), and exhaustive pattern matching with Match."
}

const FILE = "reference/data-match.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["equality", "variants", "match"])

  return (
    <>
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Data <span className="text-gradient">&amp; Match</span></>}
        intro={
          <>
            Model data as immutable <strong>values</strong>: two structurally
            identical values are <em>equal</em>, a closed set of cases is a tagged
            union, and you handle them with exhaustive pattern matching — the
            compiler refusing to let you forget a case.
          </>
        }
      >
        <Quote label="Values, not objects">
          JavaScript objects compare by identity; Effect&apos;s <Code>Data</Code>{" "}
          values compare by <span className="text-cyan">contents</span>. That one
          shift makes dedup, caching, and assertions just work.
        </Quote>
      </Hero>

      {/* Equality */}
      <Section n="01" title="Value equality">
        <p className="prose-text">
          A <Code>Data.Class</Code> gives you structural equality for free. Two
          instances with the same fields are equal under <Code>Equal.equals</Code>,
          even though they&apos;re different allocations.
        </p>
        <CodeFrame {...snip.equality} filename="data.ts" lang="ts" />
        <Callout label="Why it matters">
          Structural equality is what lets <Code>Data</Code> values work as keys in
          a <Code>HashSet</Code> / <Code>HashMap</Code>, get de-duplicated, and
          compare cleanly in tests — no custom <Code>equals</Code> to write.
        </Callout>
      </Section>

      {/* Variants */}
      <Section n="02" title="Tagged unions">
        <p className="prose-text">
          A closed set of shapes is a tagged union: each case carries its own{" "}
          <Code>_tag</Code> and fields. <Code>Data.taggedEnum</Code> derives a
          constructor for every case straight from the type.
        </p>
        <CodeFrame {...snip.variants} filename="data.ts" lang="ts" />
        <Callout label="Data or Schema?">
          Use <Code>Data.taggedEnum</Code> for in-memory variants. When the union
          must also <em>cross a boundary</em> (decode/encode JSON), reach for the
          schema-backed errors and classes from{" "}
          <Link href="/backend/03-schemas" className="text-cyan hover:underline">
            Lesson 03
          </Link>{" "}
          instead.
        </Callout>
      </Section>

      {/* Match */}
      <Section n="03" title="Pattern matching">
        <p className="prose-text">
          <Code>Match</Code> dispatches on a value&apos;s shape — most often its{" "}
          <Code>_tag</Code>. End the pipeline with <Code>Match.exhaustive</Code> and
          the compiler guarantees every case is covered.
        </p>
        <CodeFrame {...snip.match} filename="match.ts" lang="ts" />
        <Quote label="Exhaustiveness is a feature">
          Add a <Code>Triangle</Code> to the union and <Code>area</Code> stops
          compiling until you handle it. The union and its matchers can never
          silently drift apart.
        </Quote>
        <ModuleNote module="Data / Match">
          More: <Code>Data.Class</Code> / <Code>TaggedClass</Code> (named records),
          and from <Code>taggedEnum</Code> the generated <Code>$is</Code> /{" "}
          <Code>$match</Code> helpers. In <Code>Match</Code>:{" "}
          <Code>Match.type&lt;T&gt;()</Code> (match a type, not a value),{" "}
          <Code>when</Code> / <Code>tags</Code> / <Code>orElse</Code>, and{" "}
          <Code>Match.option</Code> / <Code>either</Code> for a non-exhaustive
          result.
        </ModuleNote>
      </Section>
    </>
  )
}

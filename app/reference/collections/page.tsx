import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Immutable collections — Effect reference",
  description:
    "Persistent, immutable collections: Chunk (an array), HashMap (a dictionary), HashSet (a set) — keyed by value equality. Every operation returns a new value and shares structure with the old one."
}

const FILE = "reference/collections.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["chunk", "hashmap", "hashset"])

  return (
    <>
      <Hero
        eyebrow="Reference · field guide"
        title={<>Immutable <span className="text-gradient">collections</span></>}
        intro={
          <>
            Effect ships persistent, immutable collections: every operation returns
            a <em>new</em> value and shares structure with the old one, so
            they&apos;re safe to hold across fibers and cheap to copy.{" "}
            <Code>Chunk</Code> is an array, <Code>HashMap</Code> a dictionary,{" "}
            <Code>HashSet</Code> a set — keyed by value equality.
          </>
        }
      >
        <Quote label="Sharing, not copying">
          &ldquo;Immutable&rdquo; doesn&apos;t mean &ldquo;slow&rdquo;. These are{" "}
          <span className="text-cyan">persistent</span> structures: a new version
          reuses most of the old one&apos;s nodes, so an update is cheap and the
          original stays valid for any fiber still holding it.
        </Quote>
      </Hero>

      {/* Chunk */}
      <Section n="01" title="Chunk — an immutable array">
        <p className="prose-text">
          <Code>Chunk</Code> is an immutable, array-like sequence with fast append
          and concat. Build it, transform it with the usual combinators, and drop
          back to a plain array at the edge. Nothing mutates — <Code>append</Code>{" "}
          returns a new chunk.
        </p>
        <CodeFrame {...snip.chunk} filename="collections.ts" lang="ts" />
      </Section>

      {/* HashMap */}
      <Section n="02" title="HashMap — keyed by value">
        <p className="prose-text">
          <Code>HashMap</Code> is a dictionary keyed by <strong>value</strong>{" "}
          equality, not reference — so structural keys work. <Code>get</Code>{" "}
          returns an{" "}
          <Link href="/reference/option-result" className="text-cyan hover:underline">
            Option
          </Link>{" "}
          — a missing key is data, never <Code>undefined</Code> — and{" "}
          <Code>set</Code> returns a new map, leaving the original untouched.
        </p>
        <CodeFrame {...snip.hashmap} filename="collections.ts" lang="ts" />
        <Callout label="Missing is a value, not a crash">
          Because <Code>get</Code> returns <Code>Option</Code>, the &ldquo;key
          isn&apos;t there&rdquo; case is in the type — you handle it with the same
          combinators as any other optional value, never a stray{" "}
          <Code>undefined</Code>.
        </Callout>
      </Section>

      {/* HashSet */}
      <Section n="03" title="HashSet — unique by value">
        <p className="prose-text">
          <Code>HashSet</Code> holds unique values by the same equality —
          duplicates collapse on the way in. <Code>add</Code>/<Code>union</Code>{" "}
          return new sets; membership is <Code>has</Code>. Great for dedup and set
          algebra without a single mutation.
        </p>
        <CodeFrame {...snip.hashset} filename="collections.ts" lang="ts" />
        <ModuleNote module="Effect collections">
          The same family includes <Code>Array</Code> and <Code>Record</Code>{" "}
          (utilities over the plain JS types), plus <Code>SortedMap</Code>,{" "}
          <Code>SortedSet</Code>, and <Code>List</Code> — all built on{" "}
          <Code>Equal</Code> and <Code>Hash</Code>, so custom values compare by
          their contents.
        </ModuleNote>
      </Section>
    </>
  )
}

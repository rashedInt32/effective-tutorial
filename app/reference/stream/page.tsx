import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Stream — Effect reference",
  description:
    "Stream<A, E, R> is a lazy, resource-safe sequence of many values: build it, transform it with the same combinators as Effect, and run it into an Effect with runCollect/runForEach/runDrain."
}

const FILE = "reference/stream.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["build", "transform", "run"])

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Stream</>}
        intro={
          <>
            A <Code>Stream&lt;A, E, R&gt;</Code> is a pull-based sequence of
            zero-or-more values — like an <Code>Effect</Code> that yields many
            results over time. It&apos;s lazy and resource-safe: nothing runs until
            you drive it, and it flows one chunk at a time instead of loading
            everything into memory.
          </>
        }
      >
        <Quote label="Effect, but many">
          If <Code>Effect</Code> is one eventual value, <Code>Stream</Code> is{" "}
          <span className="text-cyan">n</span> of them — with the same{" "}
          <Code>map</Code> / <Code>filter</Code> / <Code>mapEffect</Code> you
          already know, plus backpressure and cleanup built in.
        </Quote>
      </Hero>

      {/* Build */}
      <Section n="01" title="Build a stream">
        <p className="prose-text">
          Start from explicit values, an iterable, a numeric range, or a single{" "}
          <Code>Effect</Code>. Each is just a description — no elements flow yet.
        </p>
        <CodeFrame {...snip.build} filename="stream.ts" lang="ts" />
        <Callout label="Sources are everywhere">
          Beyond these, streams come from queues, files, sockets, and paginated
          APIs — anything that produces values over time fits the same type.
        </Callout>
      </Section>

      {/* Transform */}
      <Section n="02" title="Transform lazily">
        <p className="prose-text">
          The combinators mirror <Code>Effect</Code>, applied to every element.
          Because a stream is lazy, a pipeline over a million items only does the
          work the output actually demands.
        </p>
        <CodeFrame {...snip.transform} filename="stream.ts" lang="ts" />
        <Callout label="Pull, don't push">
          <Code>take(10)</Code> on a range of a million means exactly ten elements
          are ever produced — the consumer pulls, so upstream never overproduces.{" "}
          <Code>mapEffect</Code> even takes a <Code>concurrency</Code> just like{" "}
          <Link href="/reference/concurrency" className="text-cyan hover:underline">
            Effect.all
          </Link>
          .
        </Callout>
      </Section>

      {/* Run */}
      <Section n="03" title="Run it into an Effect">
        <p className="prose-text">
          A stream does nothing until you drain it into an <Code>Effect</Code>.{" "}
          <Code>runCollect</Code> gathers everything, <Code>runForEach</Code>{" "}
          performs an effect per element, <Code>runDrain</Code> runs purely for
          side effects.
        </p>
        <CodeFrame {...snip.run} filename="stream.ts" lang="ts" />
        <ModuleNote module="Stream">
          More: <Code>scan</Code> / <Code>flatMap</Code> / <Code>grouped</Code>{" "}
          (reshape), <Code>throttle</Code> / <Code>buffer</Code> /{" "}
          <Code>merge</Code> (timing &amp; combine), <Code>fromQueue</Code> (sources),
          and <Code>runFold</Code> / <Code>runCount</Code> (other terminals). The
          run* functions all hand you back an{" "}
          <Link href="/reference/effect" className="text-cyan hover:underline">
            Effect
          </Link>
          .
        </ModuleNote>
      </Section>

      {/* Back */}
      <div className="mt-28 border-t border-border pt-10">
        <Link href="/" className="text-sm text-cyan hover:underline">
          ← back to all sections
        </Link>
      </div>
    </main>
  )
}

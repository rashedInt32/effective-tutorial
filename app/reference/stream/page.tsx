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
  const snip = await highlightRegions(FILE, ["build", "transform", "run", "sink"])

  return (
    <>
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
          Start from explicit values, an iterable, a numeric range (both ends
          inclusive), or a single{" "}
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
          work the output actually demands. Errors flow the same way too: a failing{" "}
          <Code>mapEffect</Code> ends the stream with that <Code>E</Code>.
        </p>
        <CodeFrame {...snip.transform} filename="stream.ts" lang="ts" />
        <Callout label="Pull, don't push">
          <Code>take(10)</Code> on a range of a million stops after the first
          chunk — the consumer pulls, so the remaining ~999,000 items are never
          produced.{" "}
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
        <Callout label="Mind the memory">
          <Code>runCollect</Code> holds every element in one array. For a large or
          endless stream, use <Code>runForEach</Code> or <Code>runDrain</Code>{" "}
          instead.
        </Callout>
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

      {/* Sink */}
      <Section n="04" title="Sink — a composable consumer">
        <p className="prose-text">
          The <Code>run*</Code> functions are shorthands for one general form:{" "}
          <Code>Stream.run</Code> with a <Code>Sink</Code>. Where a stream
          describes <em>producing</em> values, a sink describes folding them into
          a single result — and because sinks are values, you build new ones from
          old.
        </p>
        <CodeFrame {...snip.sink} filename="stream.ts" lang="ts" />
        <Callout label="One pass, no intermediate array">
          The average here folds sum and count together as the elements arrive.
          Nothing accumulates in memory, and the stream is traversed once.
        </Callout>
        <ModuleNote module="Sink">
          <Code>Sink.sum</Code>, <Code>count</Code>, <Code>head</Code> /{" "}
          <Code>last</Code> (each an <Code>Option</Code>), <Code>collect</Code>,
          and <Code>forEach</Code> cover the common endings.{" "}
          <Code>Sink.reduce</Code> / <Code>fold</Code> build a custom one, and{" "}
          <Code>map</Code> / <Code>mapEffect</Code> reshape the result.
        </ModuleNote>
      </Section>
    </>
  )
}

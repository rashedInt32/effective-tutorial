import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Ref & Queue — Effect reference",
  description:
    "Fiber-safe state and messaging in Effect: a Ref<A> is an atomic mutable cell, a Queue<A> is an async back-pressured channel. Create, update, offer, take, and compose them."
}

const FILE = "reference/ref-queue.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["ref", "queue", "together"])

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Ref <span className="text-gradient">&amp; Queue</span></>}
        intro={
          <>
            Effect has no <Code>let</Code> for shared state — mutation lives behind
            two fiber-safe primitives. A <Code>Ref&lt;A&gt;</Code> is a mutable
            cell; a <Code>Queue&lt;A&gt;</Code> is an async channel fibers use to
            hand work to one another. Both are created inside an <Code>Effect</Code>.
          </>
        }
      >
        <Quote label="Safe by construction">
          Reads and updates are <span className="text-cyan">atomic</span>, so the
          torn-read and lost-update bugs of shared mutable variables simply
          can&apos;t happen — even with hundreds of fibers in flight.
        </Quote>
      </Hero>

      {/* Ref */}
      <Section n="01" title="Ref — shared mutable state">
        <p className="prose-text">
          <Code>Ref.make</Code> creates a cell; <Code>Ref.get</Code> reads it;{" "}
          <Code>Ref.update</Code> applies a function atomically. Because the update
          is atomic, concurrent writers never clobber each other.
        </p>
        <CodeFrame {...snip.ref} filename="ref.ts" lang="ts" />
        <Callout label="update vs modify">
          <Code>update</Code> transforms the value in place; <Code>modify</Code>{" "}
          transforms it <em>and</em> returns something derived (e.g. the old value)
          in the same atomic step — handy for &quot;take a ticket&quot; patterns.
        </Callout>
      </Section>

      {/* Queue */}
      <Section n="02" title="Queue — hand work between fibers">
        <p className="prose-text">
          A <Code>Queue</Code> is an async, back-pressured channel.{" "}
          <Code>offer</Code> adds an item, <Code>take</Code> removes one — each
          suspends the fiber rather than blocking, so a slow consumer naturally
          paces a fast producer.
        </p>
        <CodeFrame {...snip.queue} filename="queue.ts" lang="ts" />
        <Callout label="Pick a back-pressure policy">
          <Code>bounded</Code> makes <Code>offer</Code> wait when full (true
          back-pressure); <Code>dropping</Code> and <Code>sliding</Code> discard
          instead; <Code>unbounded</Code> never blocks. The capacity is a design
          decision, not an afterthought.
        </Callout>
      </Section>

      {/* Together */}
      <Section n="03" title="Producer & consumer, together">
        <p className="prose-text">
          The two compose into the classic pattern: one fiber fills a queue while
          another drains it, accumulating into a shared <Code>Ref</Code>.
        </p>
        <CodeFrame {...snip.together} filename="pipeline.ts" lang="ts" />
        <Quote label="State, meet concurrency">
          This is where <Code>Ref</Code> and <Code>Queue</Code> earn their keep —
          coordinating the{" "}
          <Link href="/reference/concurrency" className="text-cyan hover:underline">
            forked fibers
          </Link>{" "}
          from the Concurrency page without a single race condition.
        </Quote>
        <ModuleNote module="Ref / Queue">
          More: <Code>Ref.modify</Code> / <Code>getAndUpdate</Code> /{" "}
          <Code>updateAndGet</Code>; <Code>Queue.offerAll</Code> /{" "}
          <Code>takeAll</Code> / <Code>takeN</Code> / <Code>shutdown</Code> /{" "}
          <Code>size</Code>; and <Code>PubSub</Code> when you need to{" "}
          <em>broadcast</em> one message to many subscribers instead of handing it
          to one.
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

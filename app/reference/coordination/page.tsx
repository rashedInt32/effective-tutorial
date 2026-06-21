import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Coordination & limits — Effect reference",
  description:
    "Four fiber-safe primitives for cooperation: Semaphore limits concurrency, Deferred hands one value between fibers, Latch gates fibers until released, and Pool shares a fixed set of resources."
}

const FILE = "reference/coordination.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["semaphore", "deferred", "latch", "pool"])

  return (
    <>
      <Hero
        eyebrow="Reference · field guide"
        title={<>Coordination &amp; <span className="text-gradient">limits</span></>}
        intro={
          <>
            Four primitives for getting fibers to cooperate. A <Code>Semaphore</Code>{" "}
            limits how many run at once; a <Code>Deferred</Code> hands one value
            from one fiber to another; a <Code>Latch</Code> holds fibers at a gate;
            a <Code>Pool</Code> shares a fixed set of resources. All fiber-safe, all
            interruption-aware.
          </>
        }
      >
        <Quote label="Cooperation without locks">
          None of these is a mutex you can forget to release. They&apos;re{" "}
          <span className="text-cyan">structured</span> — acquired and released
          around an effect, cleaned up on interruption, impossible to leak.
        </Quote>
      </Hero>

      {/* Semaphore */}
      <Section n="01" title="Semaphore — limit concurrency">
        <p className="prose-text">
          A <Code>Semaphore</Code> is N permits. <Code>withPermits(k)</Code> takes
          k before running and gives them back after — so even with unbounded
          concurrency, at most N tasks touch the guarded section at once. The cure
          for &ldquo;don&apos;t hit this API with a thousand calls&rdquo;.
        </p>
        <CodeFrame {...snip.semaphore} filename="coordination.ts" lang="ts" />
      </Section>

      {/* Deferred */}
      <Section n="02" title="Deferred — a one-shot handoff">
        <p className="prose-text">
          A <Code>Deferred&lt;A, E&gt;</Code> is a box that&apos;s empty until
          someone completes it; then every awaiter gets that one result. It&apos;s
          the fiber-safe equivalent of a promise you resolve by hand — ideal for
          &ldquo;wait until X is ready&rdquo;.
        </p>
        <CodeFrame {...snip.deferred} filename="coordination.ts" lang="ts" />
        <ModuleNote module="Deferred">
          <Code>succeed</Code>, <Code>fail</Code>, <Code>complete</Code>, and{" "}
          <Code>done</Code> all settle it exactly once; later completions are
          no-ops. <Code>await</Code> blocks until it&apos;s settled.
        </ModuleNote>
      </Section>

      {/* Latch */}
      <Section n="03" title="Latch — a gate for fibers">
        <p className="prose-text">
          A <Code>Latch</Code> is a gate. Fibers that <Code>await</Code> a closed
          latch park; <Code>open</Code> releases them all at once and lets future
          awaiters straight through. Use it to line work up and start it together —
          a warmed-up worker pool, a synchronized kickoff.
        </p>
        <CodeFrame {...snip.latch} filename="coordination.ts" lang="ts" />
      </Section>

      {/* Pool */}
      <Section n="04" title="Pool — share scarce resources">
        <p className="prose-text">
          A <Code>Pool</Code> shares a fixed set of expensive resources — database
          connections, say. <Code>make</Code> acquires <Code>size</Code> of them up
          front; <Code>get</Code> borrows one within a scope and returns it
          automatically when that scope closes. Callers never open or close one by
          hand.
        </p>
        <CodeFrame {...snip.pool} filename="coordination.ts" lang="ts" />
        <Quote label="Resources, bounded and reused">
          A pool caps how many connections exist and recycles them across requests
          — the same{" "}
          <Link href="/reference/scope" className="text-cyan hover:underline">
            Scope
          </Link>{" "}
          machinery that guarantees cleanup also guarantees a borrowed resource
          goes back.
        </Quote>
      </Section>
    </>
  )
}

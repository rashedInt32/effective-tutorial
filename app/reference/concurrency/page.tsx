import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Concurrency — Effect reference",
  description:
    "Run effects together with Effect.all/forEach, race and timeout, and fork fibers with forkChild — structured concurrency where cancellation and cleanup are automatic."
}

const FILE = "reference/concurrency.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["all", "race-timeout", "fork"])

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Concurrency</>}
        intro={
          <>
            Effect&apos;s concurrency is <em>structured</em>: forked work is tied to
            its parent&apos;s lifetime, so fibers never leak and interruption
            propagates on its own. You declare <strong>how much</strong> runs at
            once — cancellation and cleanup come for free.
          </>
        }
      >
        <Quote label="You choose the width">
          The same combinators run <span className="text-cyan">sequentially</span> or{" "}
          <span className="text-cyan">in parallel</span> — the only difference is a{" "}
          <Code>concurrency</Code> option. No new API to learn for parallelism.
        </Quote>
      </Hero>

      {/* All */}
      <Section n="01" title="Run many at once">
        <p className="prose-text">
          <Code>Effect.all</Code> runs a collection and collects the results;{" "}
          <Code>Effect.forEach</Code> maps over items effectfully. The{" "}
          <Code>concurrency</Code> option decides the width.
        </p>
        <CodeFrame {...snip.all} filename="concurrency.ts" lang="ts" />
        <Callout label="The concurrency knob">
          Omit it for <strong>sequential</strong>; pass a number to{" "}
          <strong>cap</strong> in-flight work; pass <Code>&quot;unbounded&quot;</Code>{" "}
          to run everything at once. One option, the whole spectrum.
        </Callout>
      </Section>

      {/* Race / timeout */}
      <Section n="02" title="Race & timeout">
        <p className="prose-text">
          <Code>race</Code> returns whichever effect finishes first and interrupts
          the loser; <Code>timeout</Code> gives up after a <Code>Duration</Code>,
          adding a <Code>TimeoutError</Code> to the error channel.
        </p>
        <CodeFrame {...snip["race-timeout"]} filename="concurrency.ts" lang="ts" />
        <Callout label="Losing means stopping">
          The interruption is real: when one branch wins a <Code>race</Code>, the
          other&apos;s in-flight work (and its resources) are torn down — you
          don&apos;t get a dangling computation.
        </Callout>
      </Section>

      {/* Fork */}
      <Section n="03" title="Fork a background fiber">
        <p className="prose-text">
          To run something in the background, fork it onto its own fiber and keep a
          handle. <Code>Fiber.join</Code> awaits its result;{" "}
          <Code>Fiber.interrupt</Code> cancels it.
        </p>
        <CodeFrame {...snip.fork} filename="concurrency.ts" lang="ts" />
        <Quote label="A v4 rename">
          There is no plain <Code>Effect.fork</Code> in v4. Use{" "}
          <Code>forkChild</Code> (tied to the current fiber) or{" "}
          <Code>forkScoped</Code> (tied to a <Code>Scope</Code>) — both interrupt the
          child automatically when their owner ends. That&apos;s structured
          concurrency: no orphaned fibers.
        </Quote>
        <ModuleNote module="Effect / Fiber">
          More: <Code>forkScoped</Code> / <Code>forkIn</Code> /{" "}
          <Code>forkDetach</Code> (different lifetimes), <Code>raceAll</Code>,{" "}
          <Code>timeoutOption</Code>, <Code>Effect.sleep</Code>, and{" "}
          <Code>Fiber.joinAll</Code> / <Code>interrupt</Code>. The{" "}
          <Link href="/reference/effect" className="text-cyan hover:underline">
            runners
          </Link>{" "}
          all start a root fiber under the hood.
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

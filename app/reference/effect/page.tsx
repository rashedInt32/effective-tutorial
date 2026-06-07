import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "The Effect type — Effect reference",
  description:
    "Effect<A, E, R> is a description of a program: build it with succeed/sync/promise/tryPromise, sequence with gen or pipe, transform with map/flatMap/tap, and run at the edge."
}

const FILE = "reference/effect.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, [
    "create",
    "sequence",
    "transform",
    "run"
  ])

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>The Effect <span className="text-gradient">type</span></>}
        intro={
          <>
            Everything in Effect is an <Code>Effect&lt;A, E, R&gt;</Code> — a{" "}
            <em>description</em> of a program that may succeed with an{" "}
            <Code>A</Code>, fail with a typed <Code>E</Code>, and require services{" "}
            <Code>R</Code>. It does nothing until you run it, so you compose
            descriptions freely and run once, at the edge.
          </>
        }
      >
        <Quote label="The three channels">
          <span className="text-cyan">A</span> what it produces ·{" "}
          <span className="text-cyan">E</span> how it can fail (typed, not thrown) ·{" "}
          <span className="text-cyan">R</span> what it needs to run. Almost every
          combinator just moves a value through these three.
        </Quote>
      </Hero>

      {/* Create */}
      <Section n="01" title="Create — lift values & side effects in">
        <p className="prose-text">
          Get <em>into</em> an Effect. <Code>succeed</Code> / <Code>fail</Code>{" "}
          never throw; <Code>sync</Code> wraps a synchronous thunk;{" "}
          <Code>promise</Code> a non-failing async; <Code>tryPromise</Code> one that
          can reject, routing the rejection into the typed error channel.
        </p>
        <CodeFrame {...snip.create} filename="create.ts" lang="ts" />
        <Callout label="Failures are values">
          A rejected promise or a thrown error becomes a typed <Code>E</Code> you
          handle later — never an exception that escapes. Prefer a tagged error
          (here <Code>FetchError</Code>) so distinct failures stay distinguishable.
        </Callout>
      </Section>

      {/* Sequence */}
      <Section n="02" title="Sequence — gen or pipe">
        <p className="prose-text">
          Two ways to chain steps, building the <strong>identical</strong> Effect.{" "}
          <Code>Effect.gen</Code> reads like async/await — best once there are
          several steps. <Code>pipe</Code> composes with combinators — best for
          short flows.
        </p>
        <CodeFrame {...snip.sequence} filename="sequence.ts" lang="ts" />
        <Callout label="gen is just flatMap">
          Every <Code>yield*</Code> in a generator is a <Code>flatMap</Code> under
          the hood — <Code>gen</Code> is sugar for the <Code>pipe</Code> form, so
          pick whichever reads clearest for the job.
        </Callout>
      </Section>

      {/* Transform */}
      <Section n="03" title="Transform — the everyday combinators">
        <p className="prose-text">
          The same handful you met on{" "}
          <Link href="/reference/option-result" className="text-cyan hover:underline">
            Option &amp; Result
          </Link>
          , now on Effect: <Code>map</Code> a success, <Code>flatMap</Code> into
          another Effect, <Code>tap</Code> for a side effect that leaves the value
          alone, <Code>as</Code> to replace it.
        </p>
        <CodeFrame {...snip.transform} filename="transform.ts" lang="ts" />
      </Section>

      {/* Run */}
      <Section n="04" title="Run — at the edge of the app">
        <p className="prose-text">
          A description does nothing until a runner executes it — so you run{" "}
          <em>once</em>, as late as possible. <Code>runSync</Code> for synchronous
          effects, <Code>runPromise</Code> for async, <Code>runFork</Code> for a
          background fiber.
        </p>
        <CodeFrame {...snip.run} filename="run.ts" lang="ts" />
        <ModuleNote module="Effect">
          More to reach for: <Code>die</Code> (unrecoverable defect),{" "}
          <Code>andThen</Code> / <Code>zip</Code> / <Code>zipWith</Code> (combine),{" "}
          <Code>asVoid</Code>, and <Code>runPromiseExit</Code> /{" "}
          <Code>runSyncExit</Code> (capture success-or-failure). Long-running apps
          use a platform runtime like <Code>NodeRuntime.runMain</Code>. Handling the{" "}
          <Code>E</Code> channel is its own topic — next.
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

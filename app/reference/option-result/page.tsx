import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Option & Either (Result) — Effect reference",
  description:
    "Option models an absent value; Result (Effect v4's Either) models success or a typed failure. The few combinators you reach for, and how they interop with Effect."
}

const FILE = "reference/option-result.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, [
    "option-construct",
    "option-use",
    "result-construct",
    "result-use",
    "interop"
  ])

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Option <span className="text-gradient">&amp; Either</span></>}
        intro={
          <>
            Two containers you&apos;ll reach for constantly. <Code>Option</Code> is a
            value that might be <em>absent</em>; <Code>Result</Code> (Effect v4&apos;s{" "}
            <Code>Either</Code>) is one that either succeeded or{" "}
            <em>failed with a typed reason</em>. They&apos;re plain values — you
            transform them with the same handful of combinators, and only lift into
            an <Code>Effect</Code> when you actually run.
          </>
        }
      >
        <Callout label="Heads-up — Either is Result now">
          Effect v4 renamed <Code>Either</Code> to <Code>Result</Code>:{" "}
          <Code>succeed</Code> / <Code>fail</Code> instead of <Code>right</Code> /{" "}
          <Code>left</Code>, and <Code>Success</Code> / <Code>Failure</Code> instead
          of <Code>Right</Code> / <Code>Left</Code>. Same idea, new name.
        </Callout>
      </Hero>

      {/* Option */}
      <Section n="01" title="Option — a value that might be absent">
        <p className="prose-text">
          Reach for <Code>Option</Code> instead of <Code>null</Code> /{" "}
          <Code>undefined</Code> when absence is a real, expected case the type
          system should force you to handle.
        </p>
        <CodeFrame {...snip["option-construct"]} filename="option.ts" lang="ts" />
        <Callout label="Two gotchas">
          <Code>none()</Code> is a function call, not a value. And{" "}
          <Code>fromNullable</Code> is now <Code>fromNullishOr</Code> — it lifts a{" "}
          <Code>T | null | undefined</Code> into an <Code>Option&lt;T&gt;</Code>.
        </Callout>
        <p className="prose-text">
          The four you&apos;ll use daily: <Code>map</Code> / <Code>flatMap</Code>{" "}
          transform the value when it&apos;s there, <Code>filter</Code> can drop it,
          and <Code>getOrElse</Code> / <Code>match</Code> collapse back to a plain
          value.
        </p>
        <CodeFrame {...snip["option-use"]} filename="option.ts" lang="ts" />
      </Section>

      {/* Result */}
      <Section n="02" title="Result — succeeded, or failed with a reason">
        <p className="prose-text">
          <Code>Result&lt;A, E&gt;</Code> carries either a success <Code>A</Code> or
          a typed failure <Code>E</Code>. Unlike <Code>Option</Code>, the absence
          comes <em>with</em> a reason — and that reason is tracked in the type.
        </p>
        <CodeFrame {...snip["result-construct"]} filename="result.ts" lang="ts" />
        <p className="prose-text">
          The combinators mirror <Code>Option</Code>, with one addition: there are
          two sides to transform. <Code>map</Code> touches the success,{" "}
          <Code>mapError</Code> the failure, and <Code>match</Code> folds both into
          one value.
        </p>
        <CodeFrame {...snip["result-use"]} filename="result.ts" lang="ts" />
        <Quote label="One shape, two containers">
          Learn <Code>map</Code> · <Code>flatMap</Code> · <Code>filter</Code> ·{" "}
          <Code>match</Code> · <Code>getOrElse</Code> once and you know them on{" "}
          <span className="text-cyan">Option</span>,{" "}
          <span className="text-cyan">Result</span>, and{" "}
          <span className="text-cyan">Effect</span> — the uniform surface is the
          whole point.
        </Quote>
      </Section>

      {/* Interop */}
      <Section n="03" title="Lifting into Effect">
        <p className="prose-text">
          <Code>Option</Code> and <Code>Result</Code> are values, not effects — you
          can&apos;t <Code>yield*</Code> them directly. Lift them when you need to
          run alongside other effects, and capture an effect&apos;s outcome as a
          value going the other way.
        </p>
        <CodeFrame {...snip.interop} filename="interop.ts" lang="ts" />
        <ModuleNote module="Option / Result / Effect">
          More on each: <Code>Option.orElse</Code>, <Code>zipWith</Code>,{" "}
          <Code>tap</Code>, <Code>getOrNull</Code>, <Code>isSome</Code> /{" "}
          <Code>isNone</Code>; <Code>Result.flatMap</Code>, <Code>getOrElse</Code>,{" "}
          <Code>fromOption</Code>; and the bridges <Code>Effect.fromOption</Code> /{" "}
          <Code>fromResult</Code> · <Code>Effect.option</Code> /{" "}
          <Code>result</Code>.
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

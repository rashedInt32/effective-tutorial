import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Exit & Cause — Effect reference",
  description:
    "How an Effect ends, as a value: Exit is Success or Failure, a Cause says why — a typed failure, a defect, or an interruption — and Effect.exit captures it."
}

const FILE = "reference/cause-exit.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, [
    "three",
    "capture",
    "match",
    "inspect",
    "handle"
  ])

  return (
    <>
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Exit <span className="text-gradient">&amp; Cause</span></>}
        intro={
          <>
            Every Effect ends exactly once, and <Code>Exit&lt;A, E&gt;</Code> is
            that ending as a <em>value</em>: a <Code>Success</Code> holding an{" "}
            <Code>A</Code>, or a <Code>Failure</Code> holding a{" "}
            <Code>Cause&lt;E&gt;</Code>. The Cause is the <em>why</em> — and there
            are three of those, which is the part most people miss.
          </>
        }
      >
        <Quote label="Three ways to end badly">
          <span className="text-cyan">Fail</span> — the typed error you declared ·{" "}
          <span className="text-cyan">Die</span> — a defect, a bug outside the type ·{" "}
          <span className="text-cyan">Interrupt</span> — the fiber was cancelled.
          Only the first one appears in <Code>E</Code>.
        </Quote>
      </Hero>

      {/* Three */}
      <Section n="01" title="The three endings">
        <p className="prose-text">
          <Code>fail</Code> puts a value in the error channel, where the compiler
          tracks it. <Code>die</Code> raises a <strong>defect</strong> — something
          you never planned for, so it stays out of the type.{" "}
          <Code>interrupt</Code> stops the fiber. All three produce a{" "}
          <Code>Failure</Code>; only the first is in <Code>E</Code>.
        </p>
        <CodeFrame {...snip.three} filename="cause-exit.ts" lang="ts" />
        <Callout label="Why the distinction earns its keep">
          <Code>catchTag</Code> and friends recover from the <em>typed</em> side
          only. A defect keeps propagating past every such handler, which is what
          you want: a bug should reach the top and be logged loudly, not be
          quietly swallowed by a retry.
        </Callout>
      </Section>

      {/* Capture */}
      <Section n="02" title="Capture the ending as a value">
        <p className="prose-text">
          <Code>Effect.exit</Code> converts any outcome into an{" "}
          <Code>Exit</Code> you can inspect. The error channel becomes{" "}
          <Code>never</Code> — failing is no longer <em>how it ends</em>, because
          the Exit now describes the ending instead.
        </p>
        <CodeFrame {...snip.capture} filename="cause-exit.ts" lang="ts" />
        <Callout label="This is what a test asserts on">
          <Code>Effect.runPromiseExit</Code> always resolves, never rejects — so a
          test reads the failure like any other value. That&apos;s the move{" "}
          <Link href="/backend/06-testing-your-backend" className="text-cyan hover:underline">
            Lesson 06
          </Link>{" "}
          uses to check a typed error without <Code>try/catch</Code>.
        </Callout>
      </Section>

      {/* Match */}
      <Section n="03" title="Fold both sides">
        <p className="prose-text">
          <Code>Exit.match</Code> collapses an <Code>Exit</Code> into one value by
          handling each side. The failure branch receives the whole{" "}
          <Code>Cause</Code>, not a bare error — because &ldquo;it failed&rdquo;
          isn&apos;t the whole story.
        </p>
        <CodeFrame {...snip.match} filename="cause-exit.ts" lang="ts" />
      </Section>

      {/* Inspect */}
      <Section n="04" title="Ask the Cause what happened">
        <p className="prose-text">
          A <Code>Cause</Code> holds a list of reasons, so you query it rather
          than unwrap it. <Code>findError</Code> returns your typed error if one
          is there; <Code>hasDies</Code> and <Code>hasInterrupts</Code> answer the
          other two questions. <Code>squash</Code> is the shortcut — the typed
          error if present, otherwise the defect.
        </p>
        <CodeFrame {...snip.inspect} filename="cause-exit.ts" lang="ts" />
        <ModuleNote module="Cause">
          <Code>Cause.pretty</Code> renders the whole thing for a log line, and{" "}
          <Code>prettyErrors</Code> hands back the individual errors.{" "}
          <Code>findDefect</Code> / <Code>findInterrupt</Code> pull out a specific
          reason, and <Code>interruptors</Code> names the fibers that cancelled
          this one.
        </ModuleNote>
      </Section>

      {/* Handle */}
      <Section n="05" title="Catch the whole cause">
        <p className="prose-text">
          You rarely build a <Code>Cause</Code>; you catch one.{" "}
          <Code>Effect.catchCause</Code> sees <em>every</em> ending, which makes it
          the place to log a defect instead of losing it. The tag-based catchers
          from{" "}
          <Link href="/reference/errors" className="text-cyan hover:underline">
            Fail &amp; recover
          </Link>{" "}
          only ever see the typed side.
        </p>
        <CodeFrame {...snip.handle} filename="cause-exit.ts" lang="ts" />
        <Quote label="Nothing disappears">
          A typed failure, a thrown bug, and a cancellation are three different
          events — and Effect keeps them distinguishable all the way to the edge.
          You decide what each one means; none of them vanishes on the way.
        </Quote>
      </Section>
    </>
  )
}

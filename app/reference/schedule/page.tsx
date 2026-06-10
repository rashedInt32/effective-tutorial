import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Schedule — Effect reference",
  description:
    "Reusable repetition policies in Effect: build with recurs/spaced/exponential, compose with jittered/both/andThen, and apply with Effect.retry (on failure) or Effect.repeat (on success)."
}

const FILE = "reference/schedule.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["build", "compose", "apply"])

  return (
    <>
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Schedule</>}
        intro={
          <>
            A <Code>Schedule</Code> is a reusable <strong>policy</strong> for
            repetition: when to recur, how long to wait, and when to stop. You
            build one declaratively, then hand it to <Code>Effect.retry</Code>{" "}
            (re-run on failure) or <Code>Effect.repeat</Code> (re-run on success).
          </>
        }
      >
        <Quote label="The policy is a value">
          Backoff, jitter, and caps stop being scattered <Code>setTimeout</Code>{" "}
          logic and become a <span className="text-cyan">named, composable
          value</span> you can reuse, test, and reason about on its own.
        </Quote>
      </Hero>

      {/* Build */}
      <Section n="01" title="Build a policy">
        <p className="prose-text">
          Start from a building block: a fixed count with <Code>recurs</Code>, a
          constant gap with <Code>spaced</Code>, or growing backoff with{" "}
          <Code>exponential</Code>.
        </p>
        <CodeFrame {...snip.build} filename="schedule.ts" lang="ts" />
        <Callout label="Many shapes">
          Also <Code>fixed</Code> (a steady interval regardless of run time),{" "}
          <Code>fibonacci</Code>, <Code>cron</Code> (wall-clock times), and{" "}
          <Code>forever</Code>. Each is just a <Code>Schedule</Code> you can refine.
        </Callout>
      </Section>

      {/* Compose */}
      <Section n="02" title="Compose policies">
        <p className="prose-text">
          The power is in composition. <Code>jittered</Code> randomizes delays to
          avoid thundering herds; <Code>both</Code> continues only while both
          policies would — the idiomatic way to cap an otherwise unbounded backoff.
        </p>
        <CodeFrame {...snip.compose} filename="schedule.ts" lang="ts" />
        <Callout label="And/or/then">
          <Code>both</Code> is &quot;and&quot; (stop when either stops),{" "}
          <Code>either</Code> is &quot;or&quot; (stop when both stop), and{" "}
          <Code>andThen</Code> runs one policy, then switches to another — e.g. a
          few fast retries, then a slow steady poll.
        </Callout>
      </Section>

      {/* Apply */}
      <Section n="03" title="Apply it">
        <p className="prose-text">
          A schedule is just a description, so the same value drives both directions:{" "}
          <Code>retry</Code> re-runs an effect while it keeps <em>failing</em>,{" "}
          <Code>repeat</Code> re-runs it while it keeps <em>succeeding</em>.
        </p>
        <CodeFrame {...snip.apply} filename="schedule.ts" lang="ts" />
        <Quote label="One policy, both directions">
          This is the same <Code>retry</Code> the{" "}
          <Link href="/reference/errors" className="text-cyan hover:underline">
            Fail &amp; recover
          </Link>{" "}
          page used — now with a policy you composed deliberately instead of a bare
          count.
        </Quote>
        <ModuleNote module="Schedule / Effect">
          More builders: <Code>fixed</Code>, <Code>fibonacci</Code>,{" "}
          <Code>cron</Code>, <Code>windowed</Code>. More combinators:{" "}
          <Code>andThen</Code>, <Code>either</Code>, <Code>addDelay</Code> /{" "}
          <Code>modifyDelay</Code>, <Code>tap</Code>, <Code>collectOutputs</Code>.
          Pair with <Code>retry</Code> / <Code>repeat</Code> — and{" "}
          <Code>retryOrElse</Code> / <Code>repeatOrElse</Code> for a fallback when
          the policy is exhausted.
        </ModuleNote>
      </Section>
    </>
  )
}

import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Fail & recover — Effect reference",
  description:
    "Effect's typed error channel: model failures as tagged errors, recover with catchTag/catchTags, fold with match, fall back, and retry on a Schedule. Defects are a separate lane."
}

const FILE = "reference/errors.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, [
    "fail",
    "catch-tag",
    "fold",
    "retry"
  ])

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Fail <span className="text-gradient">&amp; recover</span></>}
        intro={
          <>
            The <Code>E</Code> in <Code>Effect&lt;A, E, R&gt;</Code> makes failure a
            typed value: every way an effect can fail is visible in its type, and
            you recover with combinators — no <Code>try</Code>/<Code>catch</Code>,
            no swallowed errors.
          </>
        }
      >
        <Quote label="Two kinds of wrong">
          <span className="text-cyan">Failures</span> are expected, typed, and
          recoverable (the <Code>E</Code> channel).{" "}
          <span className="text-cyan">Defects</span> are bugs — unexpected and
          outside the type. You handle the first and usually let the second crash.
        </Quote>
      </Hero>

      {/* Fail */}
      <Section n="01" title="Failures vs defects">
        <p className="prose-text">
          Model a recoverable failure as a <strong>tagged error</strong> and put it
          in the <Code>E</Code> channel with <Code>fail</Code>. Use <Code>die</Code>{" "}
          for a defect — something you never expect to handle.
        </p>
        <CodeFrame {...snip.fail} filename="errors.ts" lang="ts" />
        <Callout label="Why tagged?">
          The <Code>_tag</Code> is what <Code>catchTag</Code> matches on, and it
          keeps distinct failures from blurring together in the channel. (See{" "}
          <Link href="/backend/03-schemas" className="text-cyan hover:underline">
            Lesson 03
          </Link>{" "}
          for schema-backed errors that also serialize.)
        </Callout>
      </Section>

      {/* Catch by tag */}
      <Section n="02" title="Recover by tag">
        <p className="prose-text">
          <Code>catchTag</Code> handles one failure; <Code>catchTags</Code> handles
          several with a record. What you handle <em>leaves</em> the error channel —
          the type shrinks to exactly what&apos;s left.
        </p>
        <CodeFrame {...snip["catch-tag"]} filename="recover.ts" lang="ts" />
        <Callout label="The compiler tracks it">
          After catching <Code>NotFound</Code>, the result is{" "}
          <Code>Effect&lt;string, Timeout&gt;</Code> — the leftover failure is still
          in the type until you handle it too. You can never forget a case.
        </Callout>
      </Section>

      {/* Fold / fallback */}
      <Section n="03" title="Fold both sides, or fall back">
        <p className="prose-text">
          Sometimes you don&apos;t want to keep an Effect alive — you want a value.{" "}
          <Code>match</Code> folds failure and success into one;{" "}
          <Code>orElseSucceed</Code> supplies a blanket fallback.
        </p>
        <CodeFrame {...snip.fold} filename="recover.ts" lang="ts" />
        <Quote label="match, everywhere">
          The same <Code>match</Code> you used on{" "}
          <Link href="/reference/option-result" className="text-cyan hover:underline">
            Option &amp; Result
          </Link>{" "}
          — fold the container into a plain value by handling every side.
        </Quote>
      </Section>

      {/* Retry */}
      <Section n="04" title="Retry on a policy">
        <p className="prose-text">
          Transient failures deserve another go. <Code>retry</Code> takes a simple
          count or a <Code>Schedule</Code> — the effect runs once, then the policy
          decides whether and when to re-run.
        </p>
        <CodeFrame {...snip.retry} filename="retry.ts" lang="ts" />
        <ModuleNote module="Effect / Schedule">
          More recovery: <Code>catchCause</Code> / <Code>catchDefect</Code> (reach
          the full cause), <Code>catchIf</Code>, <Code>mapError</Code> /{" "}
          <Code>tapError</Code>, <Code>ignore</Code>, and <Code>Effect.exit</Code> /{" "}
          <Code>Effect.result</Code> to capture the outcome as a value. Policies:{" "}
          <Code>Schedule.recurs</Code>, <Code>spaced</Code>, <Code>exponential</Code>,{" "}
          <Code>fixed</Code>.
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

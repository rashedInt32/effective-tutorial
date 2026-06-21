import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"
import { lessonBySlug } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "06 · Testing your backend — Effect backend",
  description:
    "Cash in Lesson 04's promise: swap a fake UserRepo Layer, run the program with Effect.runPromise, assert on the Exit, and drive time deterministically with TestClock — no @effect/vitest, just plain vitest."
}

const FILE = "backend/06-testing-your-backend.ts"
const LESSON = lessonBySlug("06-testing-your-backend")

export default async function Lesson() {
  const snip = await highlightRegions(FILE, ["define", "double", "run", "failure", "clock"])

  return (
    <>
      <Hero
        eyebrow={`Backend · Lesson ${LESSON.n}`}
        title={<>Testing your <span className="text-gradient">backend</span></>}
        intro={
          <>
            Lesson 04 made a promise: because a handler <em>asks</em> for{" "}
            <Code>UserRepo</Code> instead of importing a database, a test can hand
            it a different <Code>Layer</Code> and run the byte-for-byte production
            program — no server, no DB. This lesson cashes it in. No{" "}
            <Code>@effect/vitest</Code> — just plain <Code>vitest</Code>, core{" "}
            <Code>effect</Code>, and a <Code>Clock</Code> you control.
          </>
        }
      >
        <Quote label="The program never changes">
          Only the <span className="text-cyan">Layer</span> does. The code under
          test in CI is the same code that runs in production — what you swap is
          where its dependencies come from.
        </Quote>
      </Hero>

      {/* Q1 — the double */}
      <Section n="Q1" title="How do I fake a dependency?">
        <p className="prose-text">
          You don&apos;t mock it — you build it differently. A test double is just
          another <Code>Layer</Code> for the same tag, with fixed data and no I/O.
          The same <Code>UserRepo</Code>, <Code>User</Code>, and{" "}
          <Code>UserNotFound</Code> from Lessons 04/05, restated so this file
          stands alone:
        </p>
        <CodeFrame {...snip.define} filename="fixtures.ts" lang="ts" />
        <CodeFrame {...snip.double} filename="repo.test.ts" lang="ts" />
        <Callout label="No mocks, no monkey-patching">
          <Code>Layer.succeed</Code> builds a service from a plain object. The
          program under test can&apos;t tell it from production — it only ever saw
          the tag.
        </Callout>
      </Section>

      {/* Q2 — run it */}
      <Section n="Q2" title="How do I run an Effect in a test?">
        <p className="prose-text">
          An <Code>Effect</Code> is a description; a test <em>runs</em> it.{" "}
          <Code>Effect.runPromise</Code> returns a promise of the success value, so
          it drops straight into a vitest <Code>it</Code>. Provide the double, run,
          assert.
        </p>
        <CodeFrame {...snip.run} filename="repo.test.ts" lang="ts" />
      </Section>

      {/* Q3 — failures */}
      <Section n="Q3" title="How do I assert on a failure?">
        <p className="prose-text">
          A typed failure is data, not an exception — so don&apos;t reach for{" "}
          <Code>try/catch</Code>. <Code>runPromiseExit</Code> always resolves, to
          an <Code>Exit</Code> that is either a success or a typed failure.{" "}
          <Code>Exit.isFailure</Code> narrows it, and the declared error is right
          there in the cause.
        </p>
        <CodeFrame {...snip.failure} filename="repo.test.ts" lang="ts" />
        <ModuleNote module="Exit / Cause">
          <Code>Exit.isSuccess</Code> for the happy path, and a <Code>Cause</Code>{" "}
          carries the full failure tree — the typed error, defects, and
          interruptions — so you can assert on exactly what went wrong.
        </ModuleNote>
      </Section>

      {/* Q4 — time */}
      <Section n="Q4" title="How do I test something that waits?">
        <p className="prose-text">
          Time is the usual reason tests are slow and flaky. <Code>TestClock</Code>{" "}
          makes time a value you advance by hand: provide its <Code>layer</Code>,
          fork the effect that waits, jump the clock past the deadline, and join —
          the timeout fires with <em>no real waiting</em>. A 30-second deadline,
          verified in microseconds.
        </p>
        <CodeFrame {...snip.clock} filename="timeout.test.ts" lang="ts" />
        <Callout label="Why read time as an Effect">
          This is the payoff of <Code>Clock.currentTimeMillis</Code> over{" "}
          <Code>Date.now()</Code>: the clock is a service, so a test can substitute
          one whose &ldquo;now&rdquo; you decide. The same code is deterministic
          under test and real in production.
        </Callout>
      </Section>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

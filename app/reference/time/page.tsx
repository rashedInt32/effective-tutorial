import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Time — Effect reference",
  description:
    "Time in Effect is three immutable types: Duration (a span), DateTime (an instant), and Clock (the service that tells you 'now' — read as an Effect, so a test can fake it)."
}

const FILE = "reference/time.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["duration", "datetime", "clock"])

  return (
    <>
      <Hero
        eyebrow="Reference · field guide"
        title={<>Time</>}
        intro={
          <>
            Time is three small, immutable types. A <Code>Duration</Code> is a
            length of time; a <Code>DateTime</Code> is a point in time; a{" "}
            <Code>Clock</Code> is the service that tells you what <em>now</em> is —
            read as an <Code>Effect</Code>, so a test can fake it.
          </>
        }
      >
        <Quote label="Now is a dependency">
          The moment you read the time through a service instead of{" "}
          <Code>Date.now()</Code>, &ldquo;now&rdquo; becomes something you can{" "}
          <span className="text-cyan">substitute</span> — which is what makes
          time-dependent code testable at all.
        </Quote>
      </Hero>

      {/* Duration */}
      <Section n="01" title="Duration — a span of time">
        <p className="prose-text">
          A <Code>Duration</Code> is an exact length. Build it from a unit — and
          most APIs that take a delay also accept the shorthand string{" "}
          <Code>&quot;5 seconds&quot;</Code>. Durations combine and compare as
          values; <Code>toMillis</Code> drops to a number, <Code>format</Code> to
          a label.
        </p>
        <CodeFrame {...snip.duration} filename="time.ts" lang="ts" />
        <ModuleNote module="Duration">
          <Code>nanos</Code>, <Code>micros</Code>, <Code>hours</Code>,{" "}
          <Code>days</Code>, <Code>weeks</Code> to construct;{" "}
          <Code>isLessThan</Code>, <Code>between</Code>, <Code>min</Code>,{" "}
          <Code>max</Code> to compare; <Code>times</Code> and <Code>sum</Code> to
          do arithmetic.
        </ModuleNote>
      </Section>

      {/* DateTime */}
      <Section n="02" title="DateTime — a point in time">
        <p className="prose-text">
          A <Code>DateTime</Code> is an instant. <Code>now</Code> is an{" "}
          <Code>Effect</Code> — it reads the <Code>Clock</Code>, so it&apos;s
          testable — while <Code>makeUnsafe</Code> builds one from an ISO string,
          epoch millis, or parts. Math returns a <strong>new</strong> value;
          nothing mutates.
        </p>
        <CodeFrame {...snip.datetime} filename="time.ts" lang="ts" />
        <Callout label="Immutable, like everything else">
          <Code>DateTime.add</Code> doesn&apos;t change its input — it returns a
          fresh instant. Time math is just value transformation, so it composes
          and never surprises a caller holding the old value.
        </Callout>
      </Section>

      {/* Clock */}
      <Section n="03" title="Clock — a testable now">
        <p className="prose-text">
          Why read the time through a service instead of <Code>Date.now()</Code>?
          Because the service is swappable. <Code>Clock.currentTimeMillis</Code> is
          itself an <Code>Effect</Code>: in production it reads the wall clock;
          under <Code>TestClock</Code> it reads the time you set — so the same code
          is deterministic in a test.
        </p>
        <CodeFrame {...snip.clock} filename="time.ts" lang="ts" />
        <Quote label="The bridge to TestClock">
          Everything that asks the <Code>Clock</Code> for the time can be driven by{" "}
          <Link href="/backend/06-testing-your-backend" className="text-cyan hover:underline">
            TestClock
          </Link>{" "}
          in a test — advance it and timeouts, retries, and schedules fire with no
          real waiting.
        </Quote>
      </Section>
    </>
  )
}

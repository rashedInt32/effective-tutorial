import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"
import { lessonBySlug } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "09 · Observability — Effect backend",
  description:
    "The three pillars, built in: structured logs that carry context, traced spans for a flame graph of every request, and metrics as cheap running aggregates — added by wrapping, not rewiring."
}

const FILE = "backend/09-observability.ts"
const LESSON = lessonBySlug("09-observability")

export default async function Lesson() {
  const snip = await highlightRegions(FILE, [
    "log",
    "install",
    "levels",
    "span",
    "metric",
    "observable"
  ])

  return (
    <>
      <Hero
        eyebrow={`Backend · Lesson ${LESSON.n}`}
        title={<>Observability</>}
        intro={
          <>
            &ldquo;It works on my machine&rdquo; ends where production begins;
            after that you only know what you measured. Effect builds the three
            pillars in — structured <strong>logs</strong>, distributed{" "}
            <strong>traces</strong>, and <strong>metrics</strong> — on the same
            context that already threads through your program, so adding them is
            wrapping, not rewiring.
          </>
        }
      >
        <Quote label="Context for free">
          Because logs, spans, and metrics ride the fiber&apos;s context, an
          annotation at the edge reaches everything downstream — no{" "}
          <span className="text-cyan">requestId</span> threaded through a dozen
          function signatures.
        </Quote>
      </Hero>

      {/* Q1 — logs */}
      <Section n="Q1" title="How do I log with context?">
        <p className="prose-text">
          Logging is an <Code>Effect</Code>, so a log line carries the fiber&apos;s
          context for free. <Code>logInfo</Code>/<Code>logError</Code> write at a
          level; <Code>annotateLogs</Code> attaches structured fields to{" "}
          <em>every</em> log the wrapped effect emits — one annotation at the edge
          stamps <Code>requestId</Code> onto everything downstream.
        </p>
        <CodeFrame {...snip.log} filename="handler.ts" lang="ts" />
      </Section>

      {/* Q2 — install */}
      <Section n="Q2" title="How do I get machine-readable logs?">
        <p className="prose-text">
          The default logger prints human-readable lines. In production you want
          machine-readable ones: <Code>Logger.layer([Logger.consoleJson])</Code>{" "}
          swaps the logger app-wide for structured JSON — the same{" "}
          <Code>logInfo</Code> calls, now emitted with their level, timestamp,
          fiber id, and annotations as JSON your aggregator can index.
        </p>
        <CodeFrame {...snip.install} filename="logging.ts" lang="ts" />
        <Callout label="Swap the logger, not the call sites">
          Your code keeps calling <Code>logInfo</Code>. What changes is the{" "}
          <Code>Logger</Code> provided at the edge — pretty in development, JSON in
          production, captured in a test.
        </Callout>
      </Section>

      {/* Q3 — levels */}
      <Section n="Q3" title="How do I turn the noise down?">
        <p className="prose-text">
          Every line has a <strong>level</strong>, and production rarely wants all
          of them. <Code>MinimumLogLevel</Code> is a reference you provide like any
          service: anything below it is dropped before a logger sees it. Scope it
          to one part of the program to debug a noisy path without drowning the
          rest.
        </p>
        <CodeFrame {...snip.levels} filename="logging.ts" lang="ts" />
        <Callout label="The order">
          <Code>All</Code> &lt; <Code>Trace</Code> &lt; <Code>Debug</Code> &lt;{" "}
          <Code>Info</Code> &lt; <Code>Warn</Code> &lt; <Code>Error</Code> &lt;{" "}
          <Code>Fatal</Code> &lt; <Code>None</Code>. Set it to <Code>Warn</Code>{" "}
          and the <Code>logInfo</Code> calls above stop emitting — no code change,
          no commented-out lines.
        </Callout>
      </Section>

      {/* Q4 — spans */}
      <Section n="Q4" title="How do I trace a request?">
        <p className="prose-text">
          A span is a timed, named, nestable unit of work — the backbone of
          tracing. <Code>withSpan</Code> wraps any effect in one;{" "}
          <Code>annotateCurrentSpan</Code> hangs attributes on it. Nest spans and
          you get a flame graph of a request for free, exported to any
          OpenTelemetry backend once you provide a <Code>Tracer</Code>.
        </p>
        <CodeFrame {...snip.span} filename="handler.ts" lang="ts" />
        <ModuleNote module="Tracer / Effect">
          A failed effect marks its span as errored automatically, and child spans
          nest under the one in scope — so the trace mirrors your call tree with no
          manual parenting.
        </ModuleNote>
      </Section>

      {/* Q5 — metrics */}
      <Section n="Q5" title="How do I track rates and latencies?">
        <p className="prose-text">
          Metrics are cheap aggregates over time. A <Code>counter</Code> only goes
          up (requests served); a <Code>histogram</Code> records a distribution, and{" "}
          <Code>Metric.timer</Code> is the ready-made histogram of durations.{" "}
          <Code>Metric.update</Code> feeds a data point; the runtime keeps the
          running aggregate, ready to scrape — no per-event storage, unlike logs.
          Pair it with <Code>Effect.timed</Code> so the number is measured, not
          guessed.
        </p>
        <CodeFrame {...snip.metric} filename="handler.ts" lang="ts" />
      </Section>

      {/* Q6 — compose */}
      <Section n="Q6" title="How do they fit together?">
        <p className="prose-text">
          As one wrapper. The handler stays about its job; observability is a pipe
          at the boundary — a span around it, JSON logs under it, metrics recorded
          within. Add it once here, get it on every request.
        </p>
        <CodeFrame {...snip.observable} filename="handler.ts" lang="ts" />
        <Quote label="Wrapping, not rewiring">
          You didn&apos;t change a line of business logic to make it observable.
          The three pillars compose onto the effect from the outside — which is why
          you can add them after the fact, everywhere, at once.
        </Quote>
      </Section>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

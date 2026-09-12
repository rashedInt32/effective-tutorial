import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"
import { lessonBySlug } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "08 · Background work & scheduling — Effect backend",
  description:
    "Run jobs off the request path: fork a fiber bound to a Scope, supervise many with a FiberSet, repeat on a Schedule or Cron, and package it as a Layer that starts on boot and shuts down cleanly."
}

const FILE = "backend/08-background-work-and-scheduling.ts"
const LESSON = lessonBySlug("08-background-work-and-scheduling")

export default async function Lesson() {
  const snip = await highlightRegions(FILE, [
    "fork",
    "fiberset",
    "repeat",
    "cron",
    "worker"
  ])

  return (
    <>
      <Hero
        eyebrow={`Backend · Lesson ${LESSON.n}`}
        title={<>Background work &amp; <span className="text-gradient">scheduling</span></>}
        intro={
          <>
            Not every job belongs on the request path. Sending the welcome email,
            sweeping expired sessions, reconciling a ledger at 02:00 — these run on
            their own fibers, on a schedule, supervised so a crash is visible and
            shutdown is clean. Effect has the pieces built in.
          </>
        }
      >
        <Quote label="Structured by default">
          A forked fiber isn&apos;t a fire-and-forget orphan. Tie it to a{" "}
          <span className="text-cyan">Scope</span> and its lifetime is bounded —
          when the scope closes, the fiber is interrupted. No leaks, no zombies.
        </Quote>
      </Hero>

      {/* Q1 — fork */}
      <Section n="Q1" title="How do I run work off the request path?">
        <p className="prose-text">
          <Code>Effect.forkScoped</Code> runs an effect on a new fiber and ties its
          life to the surrounding <Code>Scope</Code>: when the scope closes, the
          fiber is <strong>interrupted</strong>. A route handler runs in a
          per-request scope, so a fiber forked here lives exactly as long as the
          request. That is what you want for work that should stop when the caller
          leaves — a progress stream, a speculative fetch.
        </p>
        <CodeFrame {...snip.fork} filename="jobs.ts" lang="ts" />
        <Callout label="This is not where the welcome email goes">
          Work that must <em>outlive</em> the response can&apos;t be scoped to the
          request — the scope closes the moment you reply, taking the fiber with it.
          Put that in the app-scoped <Code>FiberSet</Code> from Q5, or hand it to a
          queue.
        </Callout>
        <ModuleNote module="Effect">
          <Code>forkScoped</Code> for scope-bound work, <Code>forkDetach</Code> for
          a true daemon that outlives its parent, and <Code>forkIn</Code> to fork
          into a specific scope you hold.
        </ModuleNote>
      </Section>

      {/* Q2 — fiberset */}
      <Section n="Q2" title="How do I supervise many jobs?">
        <p className="prose-text">
          One background job is a fiber; many are a <Code>FiberSet</Code> — a
          scoped supervisor. <Code>FiberSet.run</Code> forks an effect into the set
          and removes it on completion; when the set&apos;s scope closes, every
          fiber still running is interrupted together.
        </p>
        <CodeFrame {...snip.fiberset} filename="jobs.ts" lang="ts" />
        <Callout label="One handle for the whole fleet">
          The set owns its fibers. You never track them by hand or risk leaking one
          — closing the scope tears the whole group down at once.
        </Callout>
        <ModuleNote module="FiberSet / FiberMap / FiberHandle">
          Three shapes of the same idea, all scope-owned. A{" "}
          <Code>FiberSet</Code> holds many anonymous fibers. A{" "}
          <Code>FiberMap</Code> keys them, so you can replace or interrupt one job
          by id — a per-user subscription, say. A <Code>FiberHandle</Code> holds{" "}
          <em>at most one</em>, interrupting the previous fiber when you set a new
          one, which is exactly what a debounced or restartable task needs.
        </ModuleNote>
      </Section>

      {/* Q3 — repeat */}
      <Section n="Q3" title="How do I run something on a schedule?">
        <p className="prose-text">
          A recurring job is one effect plus a <Code>Schedule</Code> — a reusable
          policy for <em>when</em> to run again. <Code>Schedule.spaced</Code> waits
          a fixed gap after each run; <Code>fixed</Code> holds a steady wall-clock
          cadence. <Code>repeat</Code> drives the effect until it fails or its
          fiber is interrupted.
        </p>
        <CodeFrame {...snip.repeat} filename="jobs.ts" lang="ts" />
        <Callout label="A failure ends the loop">
          <Code>repeat</Code> stops at the first failure — a crashed sweep would
          simply never run again. Catch inside the loop body when the schedule
          should survive one bad run.
        </Callout>
        <ModuleNote module="Schedule">
          The same policies power <Code>Effect.retry</Code> — see the{" "}
          <Link href="/reference/schedule" className="text-cyan hover:underline">
            Schedule field guide
          </Link>{" "}
          for backoff, jitter, and caps. Repeat and retry are one idea pointed two
          ways.
        </ModuleNote>
      </Section>

      {/* Q4 — cron */}
      <Section n="Q4" title="What about calendar times — every day at 02:00?">
        <p className="prose-text">
          For calendar-based timing, <Code>Schedule.cron</Code> fires on a cron
          expression. <Code>Schedule.cron</Code> takes the string directly, and a
          bad one fails the effect with <Code>CronParseError</Code>. Parsing up
          front with <Code>Cron.parseUnsafe</Code> instead throws at{" "}
          <em>boot</em>, which is what you want for a literal — better than
          discovering it at 02:00. Always name the zone.
        </p>
        <CodeFrame {...snip.cron} filename="jobs.ts" lang="ts" />
      </Section>

      {/* Q5 — worker layer */}
      <Section n="Q5" title="How do I start and stop it with the app?">
        <p className="prose-text">
          Package the whole thing as a <Code>Layer</Code> that provides nothing but{" "}
          <em>owns</em> the fibers. <Code>Layer.effectDiscard</Code> runs inside the
          layer&apos;s <Code>Scope</Code>, so forking the loops into a{" "}
          <Code>FiberSet</Code> means the worker <strong>starts</strong> when the
          app boots and <strong>stops</strong> — fibers interrupted, cleanly — when
          it shuts down. Provide it alongside your server and background work just
          runs.
        </p>
        <CodeFrame {...snip.worker} filename="scheduler.ts" lang="ts" />
        <Callout label="What actually closes the scope">
          <Code>NodeRuntime.runMain</Code> interrupts the main fiber on{" "}
          <Code>SIGINT</Code> / <Code>SIGTERM</Code>. That closes the layer scope,
          so the <Code>FiberSet</Code> interrupts every loop before the process
          exits. In Next.js the equivalent is disposing the runtime — see the{" "}
          <Link href="/backend/global-runtime" className="text-cyan hover:underline">
            global runtime page
          </Link>
          .
        </Callout>
        <Quote label="Lifecycle is the Layer's job">
          Because the fibers live in the layer&apos;s scope, you never write
          start/stop code. The same mechanism that builds the service tears its
          background work down — acquisition and release, one definition.
        </Quote>
      </Section>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Scope & resources — Effect reference",
  description:
    "Resource safety in Effect: acquireRelease pairs an acquire with a release that always runs, Effect.scoped discharges the Scope, and Layer.effect turns a scoped acquire into a service."
}

const FILE = "reference/scope.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, [
    "acquire-release",
    "scoped",
    "layer-scoped"
  ])

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Scope <span className="text-gradient">&amp; resources</span></>}
        intro={
          <>
            A <em>resource</em> is anything that must be released — a connection, a
            file handle, a lock. <Code>acquireRelease</Code> pairs opening one with
            a release step that <strong>always</strong> runs, and a{" "}
            <Code>Scope</Code> decides exactly when.
          </>
        }
      >
        <Quote label="Release is not optional">
          The finalizer runs on success, on failure, <em>and</em> on interruption —
          there is no code path, not even a cancelled fiber, that leaks the
          resource. That guarantee is the whole point.
        </Quote>
      </Hero>

      {/* Acquire / release */}
      <Section n="01" title="Acquire & release">
        <p className="prose-text">
          <Code>acquireRelease</Code> couples an acquire effect with a release
          function. The result carries a <Code>Scope</Code> in its requirements —
          a promise that &quot;something will close this for you.&quot;
        </p>
        <CodeFrame {...snip["acquire-release"]} filename="resource.ts" lang="ts" />
        <Callout label="The release sees the Exit">
          The release function also receives the <Code>Exit</Code>, so you can act
          differently on success vs failure (commit vs roll back a transaction,
          say). Here we just close, ignoring it.
        </Callout>
      </Section>

      {/* Scoped */}
      <Section n="02" title="Scope it">
        <p className="prose-text">
          <Code>Effect.scoped</Code> provides the <Code>Scope</Code> and runs every
          finalizer registered within it when the block ends. The resource lives
          exactly as long as the work that needs it.
        </p>
        <CodeFrame {...snip.scoped} filename="resource.ts" lang="ts" />
        <Callout label="Scope leaves the type">
          After <Code>scoped</Code>, <Code>Scope</Code> is gone from the
          requirements — the effect is self-contained and runnable. For a quick
          open-use-close in one shot, <Code>acquireUseRelease</Code> bundles all
          three without a visible scope at all.
        </Callout>
      </Section>

      {/* Layer-scoped */}
      <Section n="03" title="A resourceful service">
        <p className="prose-text">
          Most resources back a <em>service</em>: a database, a client pool. Wrap a
          scoped acquire in <Code>Layer.effect</Code> and the resource&apos;s
          lifetime becomes the layer&apos;s — opened on build, closed on teardown.
        </p>
        <CodeFrame {...snip["layer-scoped"]} filename="database.ts" lang="ts" />
        <Quote label="A v4 simplification">
          v4 has no separate <Code>Layer.scoped</Code> — <Code>Layer.effect</Code>{" "}
          discharges the <Code>Scope</Code> for you, tying finalizers to the layer.
          Consumers from{" "}
          <Link href="/reference/layers" className="text-cyan hover:underline">
            Layers &amp; Context
          </Link>{" "}
          just ask for <Code>Database</Code> and never think about cleanup.
        </Quote>
        <ModuleNote module="Effect / Scope">
          More: <Code>acquireUseRelease</Code> (one-shot), <Code>addFinalizer</Code>{" "}
          (register cleanup ad hoc), <Code>Effect.scope</Code> (reach the current
          scope), and <Code>Scope.make</Code> / <Code>Scope.close</Code> for manual
          control.
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

import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"
import { frontendLessonBySlug } from "@/lib/catalog"
import { HydrationDemo, type TodoRow } from "@/app/frontend/_demos/HydrationDemo"

const FILE = "frontend/14-rendering-in-nextjs.ts"
const LESSON = frontendLessonBySlug("14-rendering-in-nextjs")

export const metadata: Metadata = {
  title: "Rendering in Next.js — Effect frontend Lesson 14",
  description:
    "Server-render the first paint and hand the same atoms to the client: seed the registry with initialValues, read with useAtomSuspense, or dehydrate and hydrate a whole tree."
}

/* This page is a Server Component, so this runs at build time — it stands in
   for the `await loadTodos()` a real page would do. The value crosses into the
   client component as an ordinary prop, which is the whole mechanism. */
async function loadTodos(): Promise<ReadonlyArray<TodoRow>> {
  return [
    { id: 1, title: "Read the backend half", done: true },
    { id: 2, title: "Try atoms", done: false }
  ]
}

export default async function Lesson() {
  const [snip, serverTodos] = await Promise.all([
    highlightRegions(FILE, [
      "problem",
      "initial-values",
      "suspense",
      "serializable",
      "hydrate"
    ]),
    loadTodos()
  ])

  return (
    <>
      <Hero
        eyebrow={`Frontend · Lesson ${LESSON.n}`}
        title={<>Rendering in <span className="text-gradient">Next.js</span></>}
        intro={
          <>
            The atoms so far all start empty and fill in on the client. Fine for
            a dashboard behind a login; wasteful on a page the server could have
            answered. This closes the gap — render on the server, then hand the{" "}
            <em>same</em> atoms to the client with their values already in place.
          </>
        }
      >
        <Quote label="Two registries, not one">
          The server renders with its registry; the browser builds a fresh one.
          Getting the value across that gap is the whole job — otherwise the
          client politely fetches what the page{" "}
          <span className="text-cyan">already contained</span>.
        </Quote>
      </Hero>

      {/* Q1 — the problem */}
      <Section n="Q1" title="What goes wrong by default?">
        <p className="prose-text">
          Less than you might expect, and something subtler than you might
          expect. Next <em>awaits</em> a <Code>Suspense</Code> boundary while
          prerendering, so the HTML it ships is usually complete — there is no
          spinner in the markup. But the browser builds its <strong>own</strong>{" "}
          registry from scratch, and an atom with nothing in it has nothing to
          render. A fresh registry falls back, and the Effect runs here too, for
          data the page already contained.
        </p>
        <p className="prose-text">
          On a client-side navigation there is no server render at all, so an
          unseeded atom shows its fallback for as long as the request takes.
        </p>
        <CodeFrame {...snip.problem} filename="atoms.ts" lang="ts" />
      </Section>

      {/* Q2 — initialValues + demo */}
      <Section n="Q2" title="How do I seed the value from the server?">
        <p className="prose-text">
          <Code>RegistryProvider</Code> takes <Code>initialValues</Code>: pairs
          of an atom and the value it should already hold. A Server Component
          loads the data, passes it down as an ordinary prop, and the registry
          starts out holding it — so the <em>first</em> render is the finished
          list, with no fallback.
        </p>
        <CodeFrame {...snip["initial-values"]} filename="TodoList.tsx" lang="ts" />
        <p className="prose-text">
          Both panels below render the <strong>same atom</strong> and the{" "}
          <strong>same component</strong>. Only the right-hand registry is
          seeded with the value this page computed on the server. Press reset
          and watch the difference: the left panel falls back to a skeleton, the
          right one is simply done:
        </p>
        <HydrationDemo serverTodos={serverTodos} />
        <Callout label="This page is the example">
          The data in the right panel really did come from a Server Component —
          the <Code>loadTodos()</Code> above runs at build time and arrives here
          as a prop. That is the entire mechanism; there is no special SSR API to
          learn.
        </Callout>
      </Section>

      {/* Q3 — suspense */}
      <Section n="Q3" title="Can I skip writing the loading branch?">
        <p className="prose-text">
          <Code>useAtomSuspense</Code> reads an atom and <em>suspends</em> while
          it is initial, so React renders the nearest{" "}
          <Code>Suspense</Code> fallback instead. It returns the{" "}
          <Code>Success</Code> directly — no match, no <Code>undefined</Code> to
          guard.
        </p>
        <CodeFrame {...snip.suspense} filename="Todos.tsx" lang="ts" />
        <Callout label="Failures throw">
          By default a failure throws, so an error boundary catches it. That is
          usually what you want at a page level. Pass{" "}
          <Code>{"{ includeFailure: true }"}</Code> to handle it in the component
          instead, the way{" "}
          <Link href="/frontend/11-async-state" className="text-cyan hover:underline">
            Lesson 11
          </Link>{" "}
          does.
        </Callout>
      </Section>

      {/* Q4 — serializable */}
      <Section n="Q4" title="What if a whole tree of atoms should cross over?">
        <p className="prose-text">
          Enumerating every atom gets old. For a full round trip an atom needs a{" "}
          <Code>key</Code> and a <Code>schema</Code>, so its value can survive as
          JSON — the same <Code>Schema</Code> from{" "}
          <Link href="/backend/03-schemas" className="text-cyan hover:underline">
            Lesson 03
          </Link>
          , now describing client state.
        </p>
        <CodeFrame {...snip.serializable} filename="atoms.ts" lang="ts" />
        <p className="prose-text">
          Then <Code>dehydrate</Code> on the server and{" "}
          <Code>HydrationBoundary</Code> on the client move the lot at once,
          keyed rather than listed.
        </p>
        <CodeFrame {...snip.hydrate} filename="page.tsx" lang="ts" />
        <Callout label="Seeding is about the first render">
          <Code>initialValues</Code> guarantees the value is there when the
          registry is first read. It is not a promise that the atom&apos;s Effect
          never runs — reach for <Code>Atom.withServerValue</Code> or a{" "}
          <Code>timeToLive</Code> when you want to control that too.
        </Callout>
        <Quote label="Which one to reach for">
          <Code>initialValues</Code> when you know the handful of atoms to seed —
          it is simpler and needs no schema. <Code>dehydrate</Code> /{" "}
          <Code>hydrate</Code> when a whole tree should cross the boundary
          together.
        </Quote>
        <ModuleNote module="Atom / Hydration">
          <Code>Atom.withServerValue</Code> overrides what an atom reads during a
          server render, and <Code>withServerValueInitial</Code> forces the
          initial state there. <Code>Hydration.dehydrate</Code> takes{" "}
          <Code>encodeInitialAs</Code> to choose how pending atoms cross the
          wire.
        </ModuleNote>
      </Section>

      {/* Close */}
      <div className="mt-28 border-t border-border pt-10">
        <p className="text-sm text-muted">That&apos;s the frontend half →</p>
        <p className="mt-2 text-xl font-semibold text-foreground">
          One contract, one set of schemas, one way to describe work — from the
          socket to the button.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-cyan hover:underline"
        >
          Back to all lessons
        </Link>
      </div>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

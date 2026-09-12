import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"
import { frontendLessonBySlug } from "@/lib/catalog"
import { CounterDemo } from "@/app/frontend/_demos/CounterDemo"

const FILE = "frontend/10-state-in-the-browser.ts"
const LESSON = frontendLessonBySlug("10-state-in-the-browser")

export const metadata: Metadata = {
  title: "State in the browser — Effect frontend Lesson 10",
  description:
    "An Atom is one reactive value: declare it at module level, derive from it with get, and read or write it from React with useAtomValue, useAtom, and useAtomSet."
}

export default async function Lesson() {
  const snip = await highlightRegions(FILE, [
    "make",
    "derived",
    "writable",
    "hooks"
  ])

  return (
    <>
      <Hero
        eyebrow={`Frontend · Lesson ${LESSON.n}`}
        title={<>State in the <span className="text-gradient">browser</span></>}
        intro={
          <>
            The backend half kept every value inside an <Code>Effect</Code>. The
            client needs something else: state that <em>outlives</em> a single
            computation and that React can subscribe to. That&apos;s an{" "}
            <Code>Atom</Code> — one reactive value, read and written from anywhere
            without prop-drilling.
          </>
        }
      >
        <Quote label="Still just descriptions">
          An atom is a <span className="text-cyan">value</span>, not a store. You
          declare it, derive from it, and hand it to a hook — the same shape as
          every Effect you already wrote.
        </Quote>
      </Hero>

      {/* Q1 — install */}
      <Section n="Q1" title="What do I need?">
        <p className="prose-text">
          <Code>Atom</Code> lives in core, at{" "}
          <Code>effect/unstable/reactivity</Code>. The React bindings —{" "}
          <Code>RegistryProvider</Code> and the hooks — are a separate package,{" "}
          <Code>@effect/atom-react</Code>, pinned to the same version as{" "}
          <Code>effect</Code> itself.
        </p>
        <Callout label="Heads-up">
          Like the HTTP modules in{" "}
          <Link href="/backend/01-create-and-run-server" className="text-cyan hover:underline">
            Lesson 01
          </Link>
          , this is under <Code>unstable/</Code> and can still change between
          pre-release versions. There are Solid and Vue bindings too; only the
          hooks differ.
        </Callout>
      </Section>

      {/* Q2 — make */}
      <Section n="Q2" title="How do I hold a piece of state?">
        <p className="prose-text">
          <Code>Atom.make</Code> with a plain value. Declare it{" "}
          <strong>outside</strong> any component, so it isn&apos;t recreated on
          every render — the atom <em>is</em> the identity of that state, and
          components merely subscribe.
        </p>
        <CodeFrame {...snip.make} filename="atoms.ts" lang="ts" />
      </Section>

      {/* Q3 — derived */}
      <Section n="Q3" title="How do I derive one value from another?">
        <p className="prose-text">
          Read another atom with <Code>get</Code>. The result is a{" "}
          <strong>derived</strong> atom: recomputed when its input changes, and
          read-only, because its value is a function of the source. Dependencies
          are tracked for you.
        </p>
        <CodeFrame {...snip.derived} filename="atoms.ts" lang="ts" />
        <Callout label="The same idea as a requirement">
          Asking for <Code>get(countAtom)</Code> is the client-side echo of{" "}
          <Code>yield* UserRepo</Code> from{" "}
          <Link href="/backend/04-services-and-layers" className="text-cyan hover:underline">
            Lesson 04
          </Link>
          . You state what you need; the wiring is someone else&apos;s problem.
        </Callout>
      </Section>

      {/* Q4 — writable */}
      <Section n="Q4" title="How do I control what a write is allowed to do?">
        <p className="prose-text">
          <Code>Atom.writable</Code> splits reading from writing, so an invariant
          lives in exactly one place. Here the count can never go below zero,
          whatever a component tries to set.
        </p>
        <CodeFrame {...snip.writable} filename="atoms.ts" lang="ts" />
      </Section>

      {/* Q5 — hooks + demo */}
      <Section n="Q5" title="How do I use it from a component?">
        <p className="prose-text">
          Three hooks cover almost everything. <Code>useAtomValue</Code>{" "}
          subscribes and re-renders on change, <Code>useAtom</Code> gives you a{" "}
          <Code>useState</Code>-shaped pair, and <Code>useAtomSet</Code> writes{" "}
          <em>without</em> subscribing.
        </p>
        <CodeFrame {...snip.hooks} filename="Counter.tsx" lang="ts" />
        <p className="prose-text">
          Here it is running. The buttons and the readout are{" "}
          <strong>separate components</strong> with no props between them, and a
          third one further down reads the same atom:
        </p>
        <CounterDemo />
        <Callout label="Why useAtomSet earns its name">
          The button component only writes, so it never subscribes — clicking it
          re-renders the readout and nothing else. That distinction is free here
          and fiddly in most state libraries.
        </Callout>
        <ModuleNote module="Atom / @effect/atom-react">
          More atoms: <Code>Atom.family</Code> (one atom per key),{" "}
          <Code>Atom.searchParam</Code> (state in the URL),{" "}
          <Code>Atom.keepAlive</Code> (survive unmount). More hooks:{" "}
          <Code>useAtomRef</Code>, <Code>useAtomMount</Code>,{" "}
          <Code>useAtomSubscribe</Code>.
        </ModuleNote>
      </Section>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

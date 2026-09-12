import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"
import { frontendLessonBySlug } from "@/lib/catalog"
import { ServiceDemo } from "@/app/frontend/_demos/ServiceDemo"

const FILE = "frontend/12-services-in-the-browser.ts"
const LESSON = frontendLessonBySlug("12-services-in-the-browser")

export const metadata: Metadata = {
  title: "Services in the browser — Effect frontend Lesson 12",
  description:
    "Atom.runtime gives atoms a Layer, so a client atom can ask for a service and you choose the implementation at the edge — the same swap that made the backend testable."
}

export default async function Lesson() {
  const snip = await highlightRegions(FILE, [
    "service",
    "layers",
    "runtime",
    "swap",
    "fn"
  ])

  return (
    <>
      <Hero
        eyebrow={`Frontend · Lesson ${LESSON.n}`}
        title={<>Services in the <span className="text-gradient">browser</span></>}
        intro={
          <>
            <Link href="/backend/04-services-and-layers" className="text-cyan hover:underline">
              Lesson 04
            </Link>{" "}
            made the backend testable with one move: a handler <em>asks</em> for a
            service, and you pick the implementation at the edge. That move works
            unchanged here — an atom can ask too.
          </>
        }
      >
        <Quote label="Ask, don't import — again">
          A real API in production, a fake one in a demo, and{" "}
          <span className="text-cyan">nothing in between</span> knows which it
          got. Same idea, same code, different half of the stack.
        </Quote>
      </Hero>

      {/* Q1 — the service */}
      <Section n="Q1" title="Does a client service look any different?">
        <p className="prose-text">
          No. It is the same <Code>Context.Service</Code> declaration —
          an interface whose methods return <Code>Effect</Code>s so they can
          fail. Nothing about it is server-specific.
        </p>
        <CodeFrame {...snip.service} filename="api.ts" lang="ts" />
      </Section>

      {/* Q2 — layers */}
      <Section n="Q2" title="How do I build two implementations?">
        <p className="prose-text">
          Two <Code>Layer</Code>s over one interface. In the backend half one of
          these would talk to Postgres; here one succeeds and one always fails,
          which is what makes the error path something you can actually
          demonstrate rather than describe.
        </p>
        <CodeFrame {...snip.layers} filename="api.ts" lang="ts" />
      </Section>

      {/* Q3 — runtime */}
      <Section n="Q3" title="How does an atom get at a service?">
        <p className="prose-text">
          <Code>Atom.runtime(layer)</Code> builds a runtime that atoms draw
          services from, and <Code>runtime.atom</Code> is{" "}
          <Code>Atom.make</Code> with those services available. The Effect asks
          for <Code>UserApi</Code>, the runtime satisfies it, and the atom&apos;s
          type has no requirement left.
        </p>
        <CodeFrame {...snip.runtime} filename="atoms.ts" lang="ts" />
        <Callout label="The layer is memoized here too">
          The runtime is itself an atom, so the layer is built once, lazily, and
          torn down when nothing needs it. That is the same memoization described
          in the{" "}
          <Link href="/reference/layers" className="text-cyan hover:underline">
            Layers guide
          </Link>
          , now governing the lifetime of your client services.
        </Callout>
      </Section>

      {/* Q4 — swap + demo */}
      <Section n="Q4" title="What does swapping actually buy me?">
        <p className="prose-text">
          Point a runtime at a different layer and every atom built from it
          changes implementation. No component changes, no prop threading, no
          mocking library.
        </p>
        <CodeFrame {...snip.swap} filename="atoms.ts" lang="ts" />
        <p className="prose-text">
          Below, both buttons render the <strong>same atom body</strong> — only
          the <Code>Layer</Code> behind it differs. Switch to the broken one to
          see the typed <Code>LoadError</Code> reach the view:
        </p>
        <ServiceDemo />
        <Quote label="Testability, again as a side effect">
          This is the same seam that let{" "}
          <Link href="/backend/06-testing-your-backend" className="text-cyan hover:underline">
            Lesson 06
          </Link>{" "}
          test a server with no database. Declaring the dependency <em>was</em>{" "}
          the seam; a demo toggle and a unit test are the same trick.
        </Quote>
      </Section>

      {/* Q5 — writes */}
      <Section n="Q5" title="What about a write?">
        <p className="prose-text">
          <Code>runtime.fn</Code> makes an atom you <em>call</em> with an
          argument. The result is an <Code>AsyncResult</Code> like any other, so
          a pending save gets <Code>waiting</Code> for free — no separate{" "}
          <Code>isSubmitting</Code> flag.
        </p>
        <CodeFrame {...snip.fn} filename="atoms.ts" lang="ts" />
        <ModuleNote module="Atom">
          <Code>runtime.pull</Code> consumes a <Code>Stream</Code> page by page,{" "}
          <Code>runtime.subscriptionRef</Code> tracks a{" "}
          <Code>SubscriptionRef</Code>, and{" "}
          <Code>Atom.runtime.addGlobalLayer</Code> registers a layer every
          runtime can see — useful for a logger you want everywhere.
        </ModuleNote>
      </Section>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

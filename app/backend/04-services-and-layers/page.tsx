import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"
import { lessonBySlug } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "04 · Services & layers — Effect backend",
  description:
    "Extract handler logic into a service you ask for, build it with a Layer, provide it at the edge, and swap the implementation for tests — with Effect v4."
}

const FILE = "backend/04-services-and-layers.ts"
const LESSON = lessonBySlug("04-services-and-layers")

export default async function Lesson() {
  const snip = await highlightRegions(FILE, [
    "define",
    "build",
    "use",
    "provide",
    "swap",
    "request-scoped"
  ])

  return (
    <>
      <Hero
        eyebrow={`Backend · Lesson ${LESSON.n}`}
        title={<>Services &amp; <span className="text-gradient">layers</span></>}
        intro={
          <>
            So far every handler did its own work inline. That tangles HTTP,
            business rules, and data access into one knot. The untangler is a{" "}
            <Code>service</Code> — a typed dependency a handler <em>asks</em> for —
            built by a <Code>Layer</Code>. The handler stays about HTTP; the service
            owns the work; and at the edge you choose which implementation to plug
            in. This is dependency injection, tracked by the compiler.
          </>
        }
      />

      {/* Q1 — define */}
      <Section n="Q1" title="How do I describe a dependency?">
        <p className="prose-text">
          <Code>Context.Service</Code> declares one in a single shot: the class is
          both the <strong>tag</strong> you ask for and the <strong>shape</strong>{" "}
          you get back. This is the interface — what callers can do, with no hint of
          how. Methods return <Code>Effect</Code>s, so they can fail and require
          things of their own.
        </p>
        <CodeFrame {...snip.define} filename="repo.ts" lang="ts" />
        <Callout label="Interface, not implementation">
          Nothing here mentions a database, a Map, or an array. A service is a{" "}
          <em>promise</em> about behaviour — the &ldquo;how&rdquo; is supplied
          separately, which is exactly what makes it swappable.
        </Callout>
      </Section>

      {/* Q2 — build */}
      <Section n="Q2" title="How do I build one?">
        <p className="prose-text">
          A <Code>Layer</Code> is the recipe that constructs a service.{" "}
          <Code>Layer.effect</Code> runs an <Code>Effect</Code> to produce the
          implementation — and that effect may itself <em>ask for</em> other
          services (a connection, a logger), which then show up in the layer&apos;s
          type until you provide them. Here it&apos;s a simple in-memory store.
        </p>
        <CodeFrame {...snip.build} filename="repo.ts" lang="ts" />
        <ModuleNote module="Layer">
          <Code>Layer.succeed</Code> for a ready value, <Code>Layer.effect</Code> to
          build from an effect, <Code>Layer.provide</Code> to feed one layer into
          another, and <Code>Layer.mergeAll</Code> to combine independent layers
          into one.
        </ModuleNote>
      </Section>

      {/* Q3 — use */}
      <Section n="Q3" title="How does a handler use it?">
        <p className="prose-text">
          It <Code>yield*</Code>s the tag and just calls the method. Asking for{" "}
          <Code>UserRepo</Code> adds it to the handler&apos;s requirements — the{" "}
          <Code>R</Code> in <Code>Effect&lt;A, E, R&gt;</Code> — so the type now says
          &ldquo;this needs a UserRepo to run&rdquo; and the compiler holds you to it.
        </p>
        <CodeFrame {...snip.use} filename="handlers.ts" lang="ts" />
        <Quote label="Ask, don't import">
          Importing a concrete module hard-wires one implementation forever. Asking
          for a service through context leaves the choice open until the last
          moment — the seam where tests, fakes, and real backends slot in.
        </Quote>
      </Section>

      {/* Q4 — provide */}
      <Section n="Q4" title="How do I plug it in?">
        <p className="prose-text">
          The router carries the handler&apos;s requirement up through{" "}
          <Code>serve</Code>, so you satisfy it at the <strong>edge</strong> —{" "}
          <Code>Layer.provide(UserRepoLive)</Code> alongside the platform layer.
          Once provided, <Code>R</Code> is <Code>never</Code> and the server runs,
          exactly as in{" "}
          <Link href="/backend/01-create-and-run-server" className="text-cyan hover:underline">
            Lesson 01
          </Link>
          .
        </p>
        <CodeFrame {...snip.provide} filename="server.ts" lang="ts" />
        <Callout label="Wiring lives at the edge">
          Handlers never construct their dependencies; the composition root does.
          That one place is where the whole graph is assembled — and the only place
          you change to re-wire it.
        </Callout>
      </Section>

      {/* Q5 — swap */}
      <Section n="Q5" title="What does this buy me?">
        <p className="prose-text">
          The payoff of asking instead of importing: you can build the same service
          a different way. A test double satisfies the very same <Code>UserRepo</Code>{" "}
          tag, so the program under test is byte-for-byte the production one — only
          the layer changes. No mocks, no monkey-patching.
        </p>
        <CodeFrame {...snip.swap} filename="repo.test.ts" lang="ts" />
        <Quote label="Testability is a side effect">
          You didn&apos;t add a testing seam — declaring the dependency <em>was</em>{" "}
          the seam. The same move gives you local fakes, in-memory dev, and a real
          database in prod, all behind one unchanged interface.
        </Quote>
      </Section>

      {/* Q6 — request-scoped */}
      <Section n="Q6" title="What about per-request dependencies?">
        <p className="prose-text">
          Some dependencies are per-<em>request</em>, not per-app — a request id,
          the current user. Router <Code>middleware</Code> provides such a service
          into every wrapped handler; declare what it <Code>provides</Code>, and
          handlers read it straight from context.
        </p>
        <CodeFrame {...snip["request-scoped"]} filename="middleware.ts" lang="ts" />
        <ModuleNote module="HttpRouter">
          App-wide services go in at the edge with <Code>Layer.provide</Code>;
          request-scoped ones come from <Code>HttpRouter.middleware</Code>. Both end
          up in the same context a handler reads with <Code>yield*</Code>.
        </ModuleNote>
      </Section>

      {/* Level up → reference */}
      <div className="mt-28 border-t border-border pt-10">
        <p className="text-sm text-muted">Level up →</p>
        <Link
          href="/reference/layers"
          className="mt-2 inline-block text-xl font-semibold text-foreground hover:text-cyan transition-colors"
        >
          ★ Layers &amp; Context — the whole dependency-injection model on one page →
        </Link>
      </div>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Layers & Context — Effect reference",
  description:
    "Effect's dependency injection: declare a service with Context.Service, ask for it by yielding the tag, build it with a Layer, and provide layers until the R channel is never."
}

const FILE = "reference/layers.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, [
    "define",
    "use",
    "implement",
    "provide"
  ])

  return (
    <>
      {/* Hero */}
      <Hero
        eyebrow="Reference · field guide"
        title={<>Layers <span className="text-gradient">&amp; Context</span></>}
        intro={
          <>
            The <Code>R</Code> in <Code>Effect&lt;A, E, R&gt;</Code> is dependency
            injection, made typed. A <strong>service</strong> is something your code
            asks for; a <strong>Layer</strong> is the recipe that builds one. Provide
            layers until <Code>R</Code> is <Code>never</Code>, and the program runs.
          </>
        }
      >
        <Quote label="The R channel is a to-do list">
          Every service you use is tracked in <Code>R</Code>. The compiler won&apos;t
          let you run a program until that list is empty — you can&apos;t forget to
          wire a dependency.
        </Quote>
      </Hero>

      {/* Define */}
      <Section n="01" title="Define a service">
        <p className="prose-text">
          <Code>Context.Service</Code> declares a service in one shot: the class is
          both the <strong>tag</strong> you ask for and the <strong>shape</strong>{" "}
          you get back.
        </p>
        <CodeFrame {...snip.define} filename="services.ts" lang="ts" />
        <Callout label="Tag = shape">
          You never construct a <Code>Greeter</Code> with <Code>new</Code> — the
          class is a key. Asking for it hands you the object you declared.
        </Callout>
      </Section>

      {/* Use */}
      <Section n="02" title="Ask for it">
        <p className="prose-text">
          Yield the tag to get the service. Doing so records the dependency in the
          program&apos;s <Code>R</Code> channel — visible right there in the type.
        </p>
        <CodeFrame {...snip.use} filename="program.ts" lang="ts" />
        <Callout label="Requirements accumulate">
          Use three services and all three show up in <Code>R</Code>. Nothing is
          implicit — the type always says exactly what this program needs to run.
        </Callout>
      </Section>

      {/* Implement */}
      <Section n="03" title="Build it with a Layer">
        <p className="prose-text">
          <Code>Layer.succeed</Code> wraps a ready value; <Code>Layer.effect</Code>{" "}
          builds one from an Effect — which may itself ask for other services. When
          it does, that dependency rides along in the layer&apos;s type.
        </p>
        <CodeFrame {...snip.implement} filename="layers.ts" lang="ts" />
        <Quote label="Layers compose like the effects they build">
          <Code>GreeterLive</Code> is <Code>Layer&lt;Greeter, never, Logger&gt;</Code>{" "}
          — it <span className="text-cyan">provides</span> Greeter but{" "}
          <span className="text-cyan">requires</span> Logger. Dependencies are just
          types, all the way down.
        </Quote>
      </Section>

      {/* Provide */}
      <Section n="04" title="Provide & compose">
        <p className="prose-text">
          <Code>Layer.provide</Code> feeds one layer&apos;s output into
          another&apos;s requirement; <Code>Effect.provide</Code> hands the finished
          layer to the program. Once <Code>R</Code> is <Code>never</Code>, it&apos;s
          runnable — the same wiring you saw serving a router in{" "}
          <Link href="/backend/01-create-and-run-server" className="text-cyan hover:underline">
            Lesson 01
          </Link>
          .
        </p>
        <CodeFrame {...snip.provide} filename="main.ts" lang="ts" />
        <ModuleNote module="Layer / Effect">
          More wiring: <Code>Layer.scoped</Code> (services that acquire/release a
          resource), <Code>Layer.merge</Code> / <Code>mergeAll</Code> (combine
          siblings), <Code>Layer.provideMerge</Code> (wire <em>and</em> keep a layer
          in the output), and <Code>Effect.provideService</Code> for a single
          ad-hoc service.
        </ModuleNote>
      </Section>
    </>
  )
}

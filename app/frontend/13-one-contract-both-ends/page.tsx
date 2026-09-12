import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"
import { frontendLessonBySlug } from "@/lib/catalog"
import { ContractDemo } from "@/app/frontend/_demos/ContractDemo"

const FILE = "frontend/13-one-contract-both-ends.ts"
const LESSON = frontendLessonBySlug("13-one-contract-both-ends")

export const metadata: Metadata = {
  title: "One contract, both ends — Effect frontend Lesson 13",
  description:
    "AtomHttpApi turns the HttpApi from Lesson 07 into reactive query and mutation atoms: shared schemas, shared paths, shared error types, and no codegen."
}

export default async function Lesson() {
  const snip = await highlightRegions(FILE, [
    "contract",
    "client",
    "query",
    "mutation",
    "shared"
  ])

  return (
    <>
      <Hero
        eyebrow={`Frontend · Lesson ${LESSON.n}`}
        title={<>One contract, <span className="text-gradient">both ends</span></>}
        intro={
          <>
            This is what the whole site has been building toward.{" "}
            <Link href="/backend/07-auth-and-middleware" className="text-cyan hover:underline">
              Lesson 07
            </Link>{" "}
            declared an <Code>HttpApi</Code> and got a server from it. The{" "}
            <strong>same value</strong>, imported into the browser, becomes
            reactive query and mutation atoms.
          </>
        }
      >
        <Quote label="The thing you don't write">
          No request types, no URL strings, no error mapping,{" "}
          <span className="text-cyan">no codegen step</span>. Rename a field and
          both ends stop compiling together.
        </Quote>
      </Hero>

      {/* Q1 — the contract */}
      <Section n="Q1" title="Where does the contract live?">
        <p className="prose-text">
          In a module both sides import. That sharing <em>is</em> the point — the
          server builds handlers from this value and the client builds atoms from
          it, so there is only ever one definition of a <Code>Todo</Code>.
        </p>
        <CodeFrame {...snip.contract} filename="contract.ts" lang="ts" />
        <Callout label="Nothing here is client-specific">
          This is the same <Code>HttpApi</Code> from the{" "}
          <Link href="/backend/httpapi-reference" className="text-cyan hover:underline">
            HttpApi whole-map
          </Link>
          . If you already have one on your server, you are done with this step.
        </Callout>
      </Section>

      {/* Q2 — the client */}
      <Section n="Q2" title="How do I turn it into a client?">
        <p className="prose-text">
          <Code>AtomHttpApi.Service</Code> builds a client service that also
          knows how to make atoms. It needs an <Code>HttpClient</Code> layer —{" "}
          <Code>FetchHttpClient.layer</Code> anywhere <Code>fetch</Code> exists.
        </p>
        <CodeFrame {...snip.client} filename="client.ts" lang="ts" />
      </Section>

      {/* Q3 — query */}
      <Section n="Q3" title="How do I read data?">
        <p className="prose-text">
          <Code>query</Code> names a group and an endpoint and hands back an
          atom. It is an <Code>AsyncResult</Code> atom like any other from{" "}
          <Link href="/frontend/11-async-state" className="text-cyan hover:underline">
            Lesson 11
          </Link>
          , so <Code>waiting</Code> and the typed failure come along unchanged.
        </p>
        <CodeFrame {...snip.query} filename="atoms.ts" lang="ts" />
        <Callout label="What reactivityKeys are for">
          The key labels what this query <em>depends on</em>. It does nothing by
          itself — its purpose is to let something else invalidate this query
          later by naming the same key. That something is a mutation.
        </Callout>
      </Section>

      {/* Q4 — mutation + demo */}
      <Section n="Q4" title="How do I write, and refresh what changed?">
        <p className="prose-text">
          <Code>mutation</Code> gives you a function-shaped atom. Pass the same{" "}
          <Code>reactivityKeys</Code> when you call it and, on success, anything
          keyed on <Code>&quot;todos&quot;</Code> refreshes. That is the whole of
          the cache invalidation story: one array.
        </p>
        <CodeFrame {...snip.mutation} filename="atoms.ts" lang="ts" />
        <p className="prose-text">
          Running below. Add one and watch the <Code>POST</Code> fire, then the
          list re-fetch itself — the component never touches the query atom:
        </p>
        <ContractDemo />
        <Callout label="About this demo's transport">
          There is no server behind this page, so the demo provides an{" "}
          <Code>HttpClient</Code> that answers from an array. Requests still
          travel through the contract&apos;s schemas in both directions, so the
          encode and decode path is the real one — it just skips the wire. Swap
          in <Code>FetchHttpClient.layer</Code> and nothing else changes, which
          is the{" "}
          <Link href="/frontend/12-services-in-the-browser" className="text-cyan hover:underline">
            Lesson 12
          </Link>{" "}
          trick once more.
        </Callout>
      </Section>

      {/* Q5 — the payoff */}
      <Section n="Q5" title="So what did I avoid writing?">
        <p className="prose-text">
          It is worth being explicit, because the absence is the feature.
        </p>
        <CodeFrame {...snip.shared} filename="contract.ts" lang="ts" />
        <Quote label="One definition, or none">
          Every hand-written client is a second copy of the truth, and copies
          drift. Here the contract is a <span className="text-cyan">value</span>{" "}
          you import — so the compiler, not a code review, is what keeps the two
          ends honest.
        </Quote>
        <ModuleNote module="AtomHttpApi">
          A query takes <Code>timeToLive</Code> to cache for a duration and{" "}
          <Code>serializationKey</Code> to survive hydration (next lesson).{" "}
          <Code>transformClient</Code> attaches auth — the{" "}
          <Code>bearerToken</Code> move from{" "}
          <Link href="/backend/07-auth-and-middleware" className="text-cyan hover:underline">
            Lesson 07
          </Link>
          . There is an <Code>AtomRpc</Code> equivalent for RPC contracts.
        </ModuleNote>
      </Section>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

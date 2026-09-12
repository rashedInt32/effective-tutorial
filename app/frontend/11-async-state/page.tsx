import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"
import { frontendLessonBySlug } from "@/lib/catalog"
import { AsyncDemo } from "@/app/frontend/_demos/AsyncDemo"

const FILE = "frontend/11-async-state.ts"
const LESSON = frontendLessonBySlug("11-async-state")

export const metadata: Metadata = {
  title: "Async state — Effect frontend Lesson 11",
  description:
    "Atom.make over an Effect yields an AsyncResult: three real states instead of four booleans, and a waiting flag that keeps stale data on screen while a refresh is in flight."
}

export default async function Lesson() {
  const snip = await highlightRegions(FILE, [
    "atom",
    "states",
    "waiting",
    "failure",
    "refresh"
  ])

  return (
    <>
      <Hero
        eyebrow={`Frontend · Lesson ${LESSON.n}`}
        title={<>Async <span className="text-gradient">state</span></>}
        intro={
          <>
            This is where client state usually turns ugly: an{" "}
            <Code>isLoading</Code> boolean, an <Code>error</Code> slot, a{" "}
            <Code>data</Code> slot, and four combinations of the three that
            can&apos;t actually happen. One <Code>AsyncResult</Code> replaces the
            lot.
          </>
        }
      >
        <Quote label="Three states, one flag">
          <span className="text-cyan">Initial</span> · nothing yet ·{" "}
          <span className="text-cyan">Failure</span> · it went wrong ·{" "}
          <span className="text-cyan">Success</span> · here&apos;s the value. Plus{" "}
          <Code>waiting</Code>, which is a <em>flag on all three</em> rather than a
          fourth state.
        </Quote>
      </Hero>

      {/* Q1 — the atom */}
      <Section n="Q1" title="How do I load data into an atom?">
        <p className="prose-text">
          Hand <Code>Atom.make</Code> an <Code>Effect</Code> instead of a value.
          You get an <Code>Atom&lt;AsyncResult&lt;A, E&gt;&gt;</Code>, and the
          Effect runs when something first <em>subscribes</em> — not when the
          module loads.
        </p>
        <CodeFrame {...snip.atom} filename="atoms.ts" lang="ts" />
        <Callout label="The same laziness, on the client">
          An <Code>Effect</Code> is still a description here. Nothing fetches
          until a component asks, which is why you can declare atoms at module
          level without kicking off a dozen requests on page load.
        </Callout>
      </Section>

      {/* Q2 — the states */}
      <Section n="Q2" title="What are the states I have to handle?">
        <p className="prose-text">
          Exactly three, and <Code>AsyncResult.match</Code> makes the compiler
          check you covered each one. There is no fourth branch to forget,
          because there is no fourth state to be in.
        </p>
        <CodeFrame {...snip.states} filename="view.ts" lang="ts" />
      </Section>

      {/* Q3 — waiting */}
      <Section n="Q3" title="How do I avoid the spinner flash on refresh?">
        <p className="prose-text">
          This is the part that earns the library. <Code>waiting</Code> is a{" "}
          <strong>flag</strong>, not a state — a refresh is <Code>waiting</Code>{" "}
          while still holding the previous value. So you grey out the old rows
          instead of replacing them with an empty spinner.
        </p>
        <CodeFrame {...snip.waiting} filename="view.ts" lang="ts" />
        <Callout label="Stale-while-revalidating, for free">
          <Code>AsyncResult.getOrElse</Code> looks <em>through</em> a failure to
          the last success, so data survives a failed refresh too. Those four
          impossible boolean combinations were always trying to express this.
        </Callout>
      </Section>

      {/* Q4 — failure */}
      <Section n="Q4" title="What happens when it fails?">
        <p className="prose-text">
          The Effect&apos;s error channel becomes the{" "}
          <Code>AsyncResult</Code>&apos;s <Code>E</Code>, so a typed failure
          stays typed all the way into the view. The failure branch also carries a{" "}
          <Code>Cause</Code>, which is the same <Code>Cause</Code> from the{" "}
          <Link href="/reference/cause-exit" className="text-cyan hover:underline">
            Exit &amp; Cause
          </Link>{" "}
          guide — defects and interruptions are distinguishable here too.
        </p>
        <CodeFrame {...snip.failure} filename="atoms.ts" lang="ts" />
      </Section>

      {/* Q5 — refresh + demo */}
      <Section n="Q5" title="How do I re-run it?">
        <p className="prose-text">
          <Code>useAtomRefresh</Code> hands a component a function that re-runs
          the Effect. No cache keys and no invalidation call — refreshing is a
          property of the atom itself.
        </p>
        <CodeFrame {...snip.refresh} filename="Users.tsx" lang="ts" />
        <p className="prose-text">
          Running below. Hit refresh and watch the rows stay on screen, greyed,
          while the next fetch is in flight. <strong>Every third call fails</strong>{" "}
          on purpose, so you can see the last good data survive the failure:
        </p>
        <AsyncDemo />
        <ModuleNote module="Atom / AsyncResult">
          <Code>Atom.swr</Code> serves a cached value while revalidating,{" "}
          <Code>Atom.setIdleTTL</Code> drops an unused atom&apos;s value after a
          delay, and <Code>Atom.refreshOnWindowFocus</Code> does what it says.
          On the result: <Code>matchWithWaiting</Code> splits the waiting branch
          out, and <Code>AsyncResult.value</Code> hands you an{" "}
          <Code>Option</Code>.
        </ModuleNote>
      </Section>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

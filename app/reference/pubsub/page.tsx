import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Callout, Code, Quote, Section } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "PubSub — Effect reference",
  description:
    "A Queue hands each message to one consumer; a PubSub broadcasts each message to every subscriber. The fan-out primitive — events, live updates, notifications — where many readers each need their own copy."
}

const FILE = "reference/pubsub.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["create", "broadcast", "strategies"])

  return (
    <>
      <Hero
        eyebrow="Reference · field guide"
        title={<>PubSub</>}
        intro={
          <>
            A{" "}
            <Link href="/reference/ref-queue" className="text-cyan hover:underline">
              Queue
            </Link>{" "}
            hands each message to <em>one</em> consumer; a <Code>PubSub</Code>{" "}
            broadcasts each message to <em>every</em> subscriber. It&apos;s the
            fan-out primitive — events, live updates, change notifications — where
            many independent readers each need their own copy of the stream.
          </>
        }
      >
        <Quote label="One message, many readers">
          The difference from a Queue is the whole point: with a Queue, a message
          is <span className="text-cyan">consumed</span>; with a PubSub, it&apos;s{" "}
          <span className="text-cyan">observed</span> — by all subscribers at once.
        </Quote>
      </Hero>

      {/* Create */}
      <Section n="01" title="Make a hub">
        <p className="prose-text">
          <Code>PubSub.bounded</Code> makes a hub with backpressure: when it&apos;s
          full, publishers wait. Like a Queue, creating one is an Effect;
          subscribers attach later.
        </p>
        <CodeFrame {...snip.create} filename="pubsub.ts" lang="ts" />
        <Callout label="Late subscribers miss the past">
          A subscription only sees what is published after it attaches. Pass{" "}
          <Code>{"{ capacity: 16, replay: 10 }"}</Code> and each new subscriber
          first receives the last ten messages.
        </Callout>
      </Section>

      {/* Broadcast */}
      <Section n="02" title="Subscribe & broadcast">
        <p className="prose-text">
          The defining property: subscribe twice and <strong>both</strong>{" "}
          subscriptions receive every published value — independent copies, not
          first-come-first-served. <Code>subscribe</Code> is scoped, so a
          subscription unsubscribes automatically when its scope closes.
        </p>
        <CodeFrame {...snip.broadcast} filename="pubsub.ts" lang="ts" />
        <Callout label="Subscriptions are scoped">
          A subscription lives for the duration of its <Code>Scope</Code>. Close
          the scope and it detaches and stops retaining messages — no leak, no
          manual unsubscribe.
        </Callout>
      </Section>

      {/* Strategies */}
      <Section n="03" title="Back-pressure strategies">
        <p className="prose-text">
          The four constructors differ only in what they do when a bounded hub is
          full — pick the one that matches whether you&apos;d rather slow the
          producer or drop data.
        </p>
        <CodeFrame {...snip.strategies} filename="pubsub.ts" lang="ts" />
        <Quote label="Choose your failure mode">
          A full hub forces a decision: block the publisher (<Code>bounded</Code>),
          drop the newest (<Code>dropping</Code>), evict the oldest
          (<Code>sliding</Code>), or grow without bound (<Code>unbounded</Code>).
          There&apos;s no free lunch — only the trade-off you pick on purpose.
        </Quote>
      </Section>
    </>
  )
}

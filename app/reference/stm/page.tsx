import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Software Transactional Memory — Effect reference",
  description:
    "STM replaces locks with transactions: read and write transactional values inside Effect.tx, and the whole block commits atomically — all-or-nothing, no torn reads, and it retries itself on a conflict."
}

const FILE = "reference/stm.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["txref", "transfer", "txmap"])

  return (
    <>
      <Hero
        eyebrow="Reference · field guide"
        title={<>Software <span className="text-gradient">Transactional Memory</span></>}
        intro={
          <>
            Coordinating shared state with locks is where concurrency bugs live.
            STM replaces locks with <strong>transactions</strong>: read and write
            transactional values inside <Code>Effect.tx</Code>, and the whole block
            commits atomically — all-or-nothing, no torn reads, and it retries
            itself on a conflict.
          </>
        }
      >
        <Quote label="Atomic, composable, lock-free">
          Two transactions compose into one bigger transaction just by running
          them in the same <Code>tx</Code>. Locks don&apos;t compose like that —
          which is exactly why they deadlock.
        </Quote>
      </Hero>

      {/* TxRef */}
      <Section n="01" title="TxRef — a transactional cell">
        <p className="prose-text">
          A <Code>TxRef</Code> is a{" "}
          <Link href="/reference/ref-queue" className="text-cyan hover:underline">
            Ref
          </Link>{" "}
          that participates in transactions. Its <Code>get</Code>/<Code>set</Code>/
          <Code>update</Code> are Effects; run them inside <Code>Effect.tx</Code>{" "}
          and they commit together. A single op is already atomic — the transaction
          matters when you touch several values.
        </p>
        <CodeFrame {...snip.txref} filename="stm.ts" lang="ts" />
      </Section>

      {/* Transfer */}
      <Section n="02" title="One atomic transaction">
        <p className="prose-text">
          The canonical example: move money between two accounts. Inside one{" "}
          <Code>tx</Code>, the debit and credit either both happen or neither does
          — no observer ever sees one without the other, and no lock is held. On a
          conflicting concurrent commit, the block simply re-runs on fresh state.
        </p>
        <CodeFrame {...snip.transfer} filename="stm.ts" lang="ts" />
        <Callout label="Retry is automatic">
          You don&apos;t catch-and-loop. If a value the transaction read changed
          before it could commit, the runtime re-runs the block against the new
          state — so the committed result is always consistent.
        </Callout>
      </Section>

      {/* TxHashMap */}
      <Section n="03" title="Transactional collections">
        <p className="prose-text">
          The <Code>Tx*</Code> family mirrors the immutable collections.{" "}
          <Code>TxHashMap</Code> is the transactional sibling of <Code>HashMap</Code>:
          a multi-step edit wrapped in <Code>Effect.tx</Code> is seen by readers as
          one atomic change — never the half-applied state in between.
        </p>
        <CodeFrame {...snip.txmap} filename="stm.ts" lang="ts" />
        <ModuleNote module="Tx*">
          The whole transactional family: <Code>TxRef</Code>, <Code>TxHashMap</Code>,{" "}
          <Code>TxHashSet</Code>, <Code>TxQueue</Code>, <Code>TxChunk</Code>,{" "}
          <Code>TxSemaphore</Code>. Mix any of them in a single <Code>Effect.tx</Code>{" "}
          and they commit as one.
        </ModuleNote>
      </Section>
    </>
  )
}

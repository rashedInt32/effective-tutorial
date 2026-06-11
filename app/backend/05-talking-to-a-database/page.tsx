import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"
import { lessonBySlug } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "05 · Talking to a database — Effect backend",
  description:
    "A safe SQL client, injection-proof queries, typed rows, a repository service, transactions, errors, and migrations — with effect/unstable/sql."
}

const FILE = "backend/05-talking-to-a-database.ts"
const LESSON = lessonBySlug("05-talking-to-a-database")

export default async function Lesson() {
  const snip = await highlightRegions(FILE, [
    "client",
    "safe",
    "typed",
    "repo",
    "transaction",
    "errors",
    "migrate",
    "capstone"
  ])

  return (
    <>
      <Hero
        eyebrow={`Backend · Lesson ${LESSON.n}`}
        title={<>Talking to a <span className="text-gradient">database</span></>}
        intro={
          <>
            Lesson 04 hid storage behind a <Code>UserRepo</Code> service with an
            in-memory Map. Now we make it real. <Code>effect/unstable/sql</Code>{" "}
            gives you one <Code>SqlClient</Code> service: a safe <Code>sql</Code>{" "}
            tagged template plus typed queries, transactions, and migrations. The
            shape from Lesson 04 doesn&apos;t change — the repo is still a service
            you ask for; we only swap its <Code>Layer</Code> for one backed by the
            database.
          </>
        }
      />

      {/* Q1 — client */}
      <Section n="Q1" title="How do I run a query?">
        <p className="prose-text">
          Pull the <Code>SqlClient</Code> and use its <Code>sql</Code> template. A{" "}
          <Code>sql&#96;…&#96;</Code> is itself an <Code>Effect</Code> of rows — no
          callbacks, no manual connection handling. Every query requires{" "}
          <Code>SqlClient</Code>, so it shows up in the type until a driver is
          provided at the edge.
        </p>
        <CodeFrame {...snip.client} filename="queries.ts" lang="ts" />
        <p className="prose-text">
          Interpolated values become <strong>bound parameters</strong> — never
          spliced into the SQL text — so the template is injection-safe by
          construction. Helpers build the clauses for you.
        </p>
        <CodeFrame {...snip.safe} filename="queries.ts" lang="ts" />
        <Callout label="Safe by default">
          You can&apos;t accidentally concatenate a value into a query — the only
          way in is as a parameter. SQL injection isn&apos;t guarded against; it&apos;s
          designed out.
        </Callout>
      </Section>

      {/* Q2 — typed */}
      <Section n="Q2" title="How do I get typed values back?">
        <p className="prose-text">
          Raw rows are loosely typed. <Code>SqlSchema</Code> wraps a query with a{" "}
          <Code>Schema</Code> on each side: the request is encoded in, the rows are
          decoded out — so you work in typed values, and a row that doesn&apos;t fit
          fails loudly instead of slipping through as <Code>any</Code>.
        </p>
        <CodeFrame {...snip.typed} filename="queries.ts" lang="ts" />
        <ModuleNote module="SqlSchema">
          <Code>findOne</Code> for a single row (fails{" "}
          <Code>NoSuchElementError</Code> when absent), <Code>findAll</Code> for a
          typed array, and <Code>single</Code> / <Code>void</Code> for the
          one-or-exactly and write-only shapes.
        </ModuleNote>
      </Section>

      {/* Q3 — repo */}
      <Section n="Q3" title="How do I hide SQL behind a service?">
        <p className="prose-text">
          The same <Code>UserRepo</Code> from Lesson 04 — only the <Code>Layer</Code>{" "}
          changes. <Code>Layer.effect</Code> builds it from an effect that asks for{" "}
          <Code>SqlClient</Code>, so the dependency surfaces in the layer&apos;s
          type. Handlers still just <Code>yield* UserRepo</Code>; they never see SQL.
        </p>
        <CodeFrame {...snip.repo} filename="repo.ts" lang="ts" />
        <Quote label="The boundary holds">
          Infrastructure failures (<Code>SqlError</Code>) become defects; the only
          thing that crosses the service boundary is the domain failure the caller
          declared. Callers depend on meaning, not on the database.
        </Quote>
      </Section>

      {/* Q4 — transactions */}
      <Section n="Q4" title="How do I make several writes atomic?">
        <p className="prose-text">
          <Code>withTransaction</Code> wraps an effect in <Code>BEGIN</Code>/
          <Code>COMMIT</Code> — and <Code>ROLLBACK</Code> on failure. Every query
          inside enlists automatically; nested calls become <Code>SAVEPOINT</Code>s.
          Either both writes land, or neither does.
        </p>
        <CodeFrame {...snip.transaction} filename="repo.ts" lang="ts" />
      </Section>

      {/* Q5 — errors */}
      <Section n="Q5" title="What happens when a query fails?">
        <p className="prose-text">
          Every failure is one <Code>SqlError</Code> carrying a structured{" "}
          <Code>reason</Code>. Branch on the reason&apos;s tag to turn an expected
          database condition into a clean result — a duplicate insert becomes a
          message, not a crash.
        </p>
        <CodeFrame {...snip.errors} filename="repo.ts" lang="ts" />
        <Callout label="Some failures are retryable">
          Reasons like deadlocks, serialization failures, and timeouts report{" "}
          <Code>isRetryable</Code>, so a blanket <Code>Effect.retry</Code> with a{" "}
          <Code>Schedule</Code> does the right thing without you classifying them by
          hand.
        </Callout>
      </Section>

      {/* Q6 — migrations */}
      <Section n="Q6" title="Where does the schema live?">
        <p className="prose-text">
          In code. Each migration is an <Code>Effect</Code> that uses <Code>sql</Code>;
          the migrator records which ran in a table and applies only the pending
          ones, in id order, inside a transaction. Run it once on boot, before
          serving traffic.
        </p>
        <CodeFrame {...snip.migrate} filename="migrations.ts" lang="ts" />
      </Section>

      {/* Q7 — wire it up */}
      <Section n="Q7" title="How do I wire it into the server?">
        <p className="prose-text">
          Exactly as in Lesson 04: a route asks <Code>UserRepo</Code> and encodes
          the result through the schema. <Code>Layer.provide(UserRepoLive)</Code>{" "}
          satisfies the repo, which in turn requires <Code>SqlClient</Code> — so the
          routes layer&apos;s one remaining requirement is a driver. Provide a
          Postgres or SQLite connection at the edge, migrate on boot, and this is a
          real database-backed server.
        </p>
        <CodeFrame {...snip.capstone} filename="server.ts" lang="ts" />
      </Section>

      {/* Level up → reference */}
      <div className="mt-28 border-t border-border pt-10">
        <p className="text-sm text-muted">Level up →</p>
        <Link
          href="/backend/sql-reference"
          className="mt-2 inline-block text-xl font-semibold text-foreground hover:text-cyan transition-colors"
        >
          ★ sql — the whole map: resolvers, models, the migrator &amp; the driver
          layers in full →
        </Link>
      </div>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

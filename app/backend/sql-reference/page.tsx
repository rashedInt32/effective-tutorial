import Link from "next/link"
import type { Metadata } from "next"
import { highlightAll, highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Reveal } from "@/app/_components/Reveal"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "sql — the whole map · Effect backend",
  description:
    "effect/unstable/sql, end to end: a safe sql tagged template, typed queries, batched resolvers, table models, migrations, and structured errors — driver-agnostic, with Postgres and SQLite connect layers."
}

const FILE = "backend/sql-reference.ts"

/* Hand-curated reference menus — enumerations and the driver connect layers
   (the driver packages aren't installed here, so these are faithful, not
   typechecked — copied from the effect-smol source). */
const IMPORTS = `import { Effect, Schema } from "effect"
import { Model } from "effect/unstable/schema"
import {
  SqlClient, SqlSchema, SqlResolver, SqlModel, Migrator, SqlError
} from "effect/unstable/sql"
// + ONE driver package for the connection layer (see below)`

const CONNECT_PG = `// npm i @effect/sql-pg
import { PgClient } from "@effect/sql-pg"
import { Config, Layer, Redacted } from "effect"

// straight config:
export const PgLive = PgClient.layer({
  url: Redacted.make(process.env.DATABASE_URL!),
  maxConnections: 10
  // or: host, port, database, username, password: Redacted, ssl
})

// or read every field from the environment, typed:
export const PgFromEnv = PgClient.layerConfig({
  url: Config.Redacted("DATABASE_URL")
})
// provides: PgClient | SqlClient`

const CONNECT_SQLITE = `// npm i @effect/sql-sqlite-node
import { SqliteClient } from "@effect/sql-sqlite-node"

export const SqliteLive = SqliteClient.layer({
  filename: "app.db"
  // readonly?, disableWAL?, transformQueryNames?
})

// zero-setup, in-memory (great for tests):
export const SqliteMemory = SqliteClient.layer({ filename: ":memory:" })
// provides: SqliteClient | SqlClient`

const REASONS = `error.reason._tag === "UniqueViolation"   // + .constraint
  | "ConstraintError"     | "SqlSyntaxError"
  | "ConnectionError"*    | "AuthenticationError"   | "AuthorizationError"
  | "DeadlockError"*      | "SerializationError"*   // * isRetryable === true
  | "LockTimeoutError"*   | "StatementTimeoutError"*
  | "UnknownError"
// error.isRetryable delegates to the reason — pair it with Effect.retry.`

export default async function Page() {
  // File-backed snippets — every one is lifted from a region that typechecks.
  const snip = await highlightRegions(FILE, [
    "client",
    "template",
    "write",
    "transaction",
    "schema",
    "resolver",
    "model",
    "migrator",
    "errors",
    "capstone"
  ])
  // Hand-curated reference menus — shown code === copied code.
  const menu = await highlightAll({
    imports: { code: IMPORTS },
    connectPg: { code: CONNECT_PG },
    connectSqlite: { code: CONNECT_SQLITE },
    reasons: { code: REASONS }
  })

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Backend · Reference"
        title={<>sql — <span className="text-gradient">the whole map</span></>}
        intro={
          <>
            <Code>effect/unstable/sql</Code> is the database toolkit: one{" "}
            <Code>SqlClient</Code> service exposing a safe <Code>sql</Code> tagged
            template, plus typed queries, batched resolvers, table models, and a
            migrator. The core is <em>driver-agnostic</em> — you snap a Postgres or
            SQLite connection layer onto the edge and everything else is identical.
          </>
        }
      >
        <Quote label="The shape of everything">
          <span className="text-cyan">connect</span> (a driver layer) →{" "}
          <Code>sql</Code> for raw queries →{" "}
          <strong className="text-foreground">Schema</strong> for typed ones →{" "}
          <strong className="text-foreground">resolvers</strong> &amp;{" "}
          <strong className="text-foreground">models</strong> for the repository
          layer → <strong className="text-foreground">migrations</strong>. Every
          numbered example is lifted from a file that typechecks against{" "}
          <Code>effect@4</Code>; the connect layers are faithful source snippets.
        </Quote>
      </Hero>

      {/* Imports */}
      <Section n="00" title="What you import">
        <p className="prose-text">
          The whole core lives in <Code>effect/unstable/sql</Code> — no extra
          install. You add exactly one driver package for the connection layer,
          and nothing else in this file changes when you switch drivers.
        </p>
        <CodeFrame {...menu.imports} filename="imports.ts" lang="ts" />
        <Callout label="Core vs driver">
          <Code>SqlClient</Code> and friends are driver-agnostic and ship with{" "}
          <Code>effect</Code>. Only the <em>connection</em> —{" "}
          <Code>@effect/sql-pg</Code> or <Code>@effect/sql-sqlite-node</Code> —
          knows which database you&apos;re talking to.
        </Callout>
      </Section>

      {/* 01 — client */}
      <Section n="01" title="The client & a query">
        <p className="prose-text">
          Pull the <Code>SqlClient</Code> service and you get <Code>sql</Code> — a
          tagged template that <em>is</em> an Effect of rows. Yield it to run the
          query.
        </p>
        <CodeFrame {...snip.client} filename="queries.ts" lang="ts" />
      </Section>

      {/* 02 — template */}
      <Section n="02" title="Interpolation is always safe">
        <p className="prose-text">
          Interpolated values become <strong className="text-foreground">bound
          parameters</strong> — never spliced into the SQL text — so the template
          is injection-safe by construction. Helpers build the fiddly clauses.
        </p>
        <CodeFrame {...snip.template} filename="queries.ts" lang="ts" />
        <Quote label="Values vs fragments">
          A plain value is a parameter. A nested <Code>sql`...`</Code> is a{" "}
          <em>fragment</em> that splices in as SQL. <Code>sql.in</Code>,{" "}
          <Code>sql.and</Code>, <Code>sql.or</Code>, and{" "}
          <Code>sql.insert</Code>/<Code>sql.update</Code> produce fragments for the
          clauses you&apos;d otherwise hand-assemble.
        </Quote>
      </Section>

      {/* 03 — write */}
      <Section n="03" title="Inserts & updates">
        <p className="prose-text">
          <Code>sql.insert</Code> and <Code>sql.update</Code> turn a record into
          the right clause — column names and bound values, in the active
          dialect&apos;s syntax.
        </p>
        <CodeFrame {...snip.write} filename="queries.ts" lang="ts" />
      </Section>

      {/* 04 — transaction */}
      <Section n="04" title="Transactions">
        <p className="prose-text">
          <Code>withTransaction</Code> wraps an effect in{" "}
          <Code>BEGIN</Code>/<Code>COMMIT</Code> — and <Code>ROLLBACK</Code> on any
          failure. Every query inside enlists automatically; nested calls become{" "}
          <Code>SAVEPOINT</Code>s.
        </p>
        <CodeFrame {...snip.transaction} filename="queries.ts" lang="ts" />
        <Callout label="Rollback is just failure">
          The transaction commits iff the effect succeeds. Fail it — a validation
          error, a thrown defect, an interrupt — and the whole thing rolls back.
          No manual <Code>ROLLBACK</Code> call to forget.
        </Callout>
      </Section>

      {/* 05 — schema */}
      <Section n="05" title="Typed queries with Schema">
        <p className="prose-text">
          <Code>SqlSchema</Code> wraps a raw query with a <Code>Schema</Code> on
          each side: the request is encoded going in, the rows are decoded coming
          out — so you work in typed values, and a row that doesn&apos;t match
          fails loudly instead of leaking <Code>any</Code>.
        </p>
        <CodeFrame {...snip.schema} filename="users.ts" lang="ts" />
        <ModuleNote module="SqlSchema">
          <Code>findOne</Code> returns the first row or a{" "}
          <Code>NoSuchElementError</Code>; <Code>findOneOption</Code> returns an{" "}
          <Code>Option</Code>; <Code>findAll</Code> a typed array;{" "}
          <Code>findNonEmpty</Code> a guaranteed-non-empty one.
        </ModuleNote>
      </Section>

      {/* 06 — resolver */}
      <Section n="06" title="Batched resolvers (the N+1 fix)">
        <p className="prose-text">
          A resolver collects concurrent by-id lookups, runs them as one{" "}
          <Code>WHERE id IN (...)</Code> query, then routes each row back to its
          caller. Fire a hundred <Code>request</Code>s in parallel — one
          round-trip.
        </p>
        <CodeFrame {...snip.resolver} filename="users.ts" lang="ts" />
        <ModuleNote module="SqlResolver">
          <Code>findById</Code> matches results to ids; <Code>grouped</Code>{" "}
          returns many rows per key; <Code>ordered</Code> pairs results to
          requests positionally; <Code>request</Code> issues one through the
          resolver.
        </ModuleNote>
      </Section>

      {/* 07 — model */}
      <Section n="07" title="Table models & repositories">
        <p className="prose-text">
          A <Code>Model.Class</Code> describes a table once and derives its
          variants — the full row, the <Code>insert</Code> shape, the{" "}
          <Code>update</Code> shape, a json api shape — from per-field helpers.{" "}
          <Code>SqlModel.makeRepository</Code> then hands you typed{" "}
          <Code>insert</Code> / <Code>update</Code> / <Code>findById</Code> /{" "}
          <Code>delete</Code>.
        </p>
        <CodeFrame {...snip.model} filename="user-model.ts" lang="ts" />
        <ModuleNote module="Model">
          Field helpers set variant membership: <Code>GeneratedByApp</Code>{" "}
          (app-minted id, on every write), <Code>GeneratedByDb</Code> (db-filled,
          reads only), <Code>DateTimeInsert</Code>/<Code>DateTimeUpdate</Code>{" "}
          (auto timestamps), <Code>Sensitive</Code> (kept out of json).
        </ModuleNote>
      </Section>

      {/* 08 — migrator */}
      <Section n="08" title="Migrations">
        <p className="prose-text">
          Each migration is an Effect that uses <Code>sql</Code>. The migrator
          records which have run in a table and applies only the pending ones, in
          id order, inside a transaction.
        </p>
        <CodeFrame {...snip.migrator} filename="migrate.ts" lang="ts" />
        <ModuleNote module="Migrator">
          <Code>fromRecord</Code> takes inline migrations (shown here);{" "}
          <Code>fromFileSystem</Code> reads a directory of numbered files;{" "}
          <Code>fromGlob</Code> takes dynamic <Code>import()</Code>s — handy when
          the bundler must see them.
        </ModuleNote>
      </Section>

      {/* 09 — errors */}
      <Section n="09" title="Structured errors">
        <p className="prose-text">
          Every failure is one <Code>SqlError</Code> carrying a structured{" "}
          <Code>reason</Code>. Branch on the reason tag — and note some reasons are
          flagged <Code>isRetryable</Code>, so a blanket <Code>Effect.retry</Code>{" "}
          does the right thing on transient faults.
        </p>
        <CodeFrame {...snip.errors} filename="users.ts" lang="ts" />
        <CodeFrame {...menu.reasons} filename="SqlError.reason" lang="ts" />
      </Section>

      {/* Connect layers */}
      <Section n="10" title="Connect a driver">
        <p className="prose-text">
          Everything above needs <Code>SqlClient</Code> provided. That&apos;s the
          one driver-specific step — pick a package, build its layer, and provide
          it (often through your{" "}
          <Link href="/backend/global-runtime" className="text-cyan hover:underline">
            global runtime
          </Link>
          ). The same code runs on either.
        </p>
        <CodeFrame {...menu.connectPg} filename="db.pg.ts" lang="ts" />
        <CodeFrame {...menu.connectSqlite} filename="db.sqlite.ts" lang="ts" />
        <Callout label="Both provide SqlClient">
          Each driver layer provides the generic <Code>SqlClient</Code> (plus its
          own typed client). Your queries depend only on <Code>SqlClient</Code>,
          so swapping Postgres for SQLite — in tests, say — touches one line.
        </Callout>
      </Section>

      {/* Capstone */}
      <section className="mt-28">
        <Reveal>
          <p className="text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">
            Putting it together
          </p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-gradient">Migrate, write, read</span> — one effect
          </h2>
          <p className="mt-4 prose-text">
            The pieces composed: run the migrations, insert a row, then read it
            back through the typed query — a single effect that needs only{" "}
            <Code>SqlClient</Code>. Provide a driver layer at the edge and it&apos;s
            runnable.
          </p>
        </Reveal>
        <div className="mt-8 space-y-5">
          <CodeFrame {...snip.capstone} filename="program.ts" lang="ts" />
          <Quote label="One requirement, many backends">
            The whole program&apos;s only dependency is <Code>SqlClient</Code>.
            Provide Postgres in production and SQLite in tests from the same
            source — the queries, models, and migrations never change.
          </Quote>
        </div>
      </section>

      {/* Back */}
      <div className="mt-28 border-t border-border pt-10">
        <Link href="/" className="text-sm text-cyan hover:underline">
          ← back to all lessons
        </Link>
      </div>
    </main>
  )
}

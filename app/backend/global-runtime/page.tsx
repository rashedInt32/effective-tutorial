import Link from "next/link"
import type { Metadata } from "next"
import { highlightAll, highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Reveal } from "@/app/_components/Reveal"
import { Hero } from "@/app/_components/LessonShell"
import { Section, Callout, ModuleNote, Quote, Code } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Global runtime — one source of truth · Effect backend",
  description:
    "Build one ManagedRuntime from your app's Layer and run every effect through it — from server components, route handlers, and server actions. The Next.js + Effect integration pattern, end to end."
}

const FILE = "backend/global-runtime.ts"

/* Hand-curated reference menus — enumerations, not lifted from the typechecked
   source file. */
const IMPORTS = `import { Cause, Context, Effect, Exit, Layer, ManagedRuntime } from "effect"
// your real layers — a database client, a logger, config from env:
// import { DatabaseLive } from "./db"
// import { ConfigLive } from "./config"`

const RUNNERS = `runtime.runPromise(effect)       // Promise<A>            — the everyday runner
runtime.runPromiseExit(effect)   // Promise<Exit<A, ER | E>>  — failures as data
runtime.runFork(effect)          // Fiber<A, E>           — fire-and-forget / background
runtime.runSync(effect)          // A                     — only for sync effects
runtime.runSyncExit(effect)      // Exit<A, ER | E>
runtime.runCallback(effect, { onExit })   // node-style callback bridge

runtime.context()                // Promise<Context<R>>  — the built services
runtime.dispose()                // Promise<void>        — close scope, free resources

// ER = the layer's construction error — folded into every *Exit runner's error.`

export default async function Page() {
  // File-backed snippets — every one is lifted from a region that typechecks.
  const snip = await highlightRegions(FILE, [
    "services",
    "layer",
    "runtime",
    "singleton",
    "run-rsc",
    "run-route",
    "run-action",
    "lifecycle",
    "capstone"
  ])
  // Hand-curated reference menus — shown code === copied code.
  const menu = await highlightAll({
    imports: { code: IMPORTS },
    runners: { code: RUNNERS }
  })

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <Hero
        eyebrow="Backend · Reference"
        title={<>Global runtime — <span className="text-gradient">one source of truth</span></>}
        intro={
          <>
            Every server component, route handler, and server action needs your
            services — a database, config, loggers. Building the layer per request
            is wasteful and breaks resource sharing. The fix is a{" "}
            <Code>ManagedRuntime</Code>: build it <em>once</em> from your app&apos;s
            single <Code>Layer</Code>, then run every effect through it. This page
            is that pattern, end to end.
          </>
        }
      >
        <Quote label="The shape of everything">
          <strong className="text-foreground">services</strong> → one{" "}
          <strong className="text-foreground">Layer</strong> →{" "}
          <span className="text-cyan">ManagedRuntime</span> →{" "}
          <Code>runtime.runPromise(effect)</Code> from anywhere. The runtime
          builds the layer lazily, caches the services, and owns their lifecycle.
          Every numbered example is lifted from a file that typechecks against{" "}
          <Code>effect@4</Code>.
        </Quote>
      </Hero>

      {/* Imports */}
      <Section n="00" title="What you import">
        <p className="prose-text">
          <Code>ManagedRuntime</Code> and the data types it leans on, plus your
          own application layers.
        </p>
        <CodeFrame {...menu.imports} filename="lib/runtime.ts" lang="ts" />
      </Section>

      {/* 01 — services */}
      <Section n="01" title="Your services">
        <p className="prose-text">
          A service is a typed capability the rest of the app depends on. In a
          real app these are your database, cache, auth, and config — here, a
          config value and a stubbed user store stand in.
        </p>
        <CodeFrame {...snip.services} filename="lib/runtime.ts" lang="ts" />
      </Section>

      {/* 02 — layer */}
      <Section n="02" title="One layer for the whole app">
        <p className="prose-text">
          Each service gets a <Code>Layer</Code>; <Code>mergeAll</Code> composes
          them into one. The crucial property: nothing is left unprovided, so its
          requirements (<Code>RIn</Code>) are <Code>never</Code> — that&apos;s the
          precondition for a runnable runtime.
        </p>
        <CodeFrame {...snip.layer} filename="lib/runtime.ts" lang="ts" />
        <Callout label="This is the join point">
          Your whole dependency graph meets here. Add a service later by merging
          one more layer — every call site keeps working, no signatures change.
        </Callout>
      </Section>

      {/* 03 — runtime */}
      <Section n="03" title="Build the runtime">
        <p className="prose-text">
          <Code>ManagedRuntime.make</Code> turns the layer into a reusable
          runtime. It builds the layer <em>lazily</em> on first use, caches the
          resulting services, and owns their lifecycle — connection pools and
          everything else the layer acquires live as long as the runtime does.
        </p>
        <CodeFrame {...snip.runtime} filename="lib/runtime.ts" lang="ts" />
      </Section>

      {/* 04 — singleton */}
      <Section n="04" title="Make it a true singleton">
        <p className="prose-text">
          Next.js re-evaluates modules on every edit in dev. A naive{" "}
          <Code>make</Code> would build a fresh runtime — and a fresh DB pool — on
          each reload. Cache it on <Code>globalThis</Code> so there is exactly{" "}
          <em>one</em> across reloads.
        </p>
        <CodeFrame {...snip.singleton} filename="lib/runtime.ts" lang="ts" />
        <Quote label="Why globalThis">
          Module-level <Code>const</Code> is per-module-instance, and the dev
          server throws those away constantly. <Code>globalThis</Code> survives
          hot reloads, so the pool is created once — not on every save.
        </Quote>
      </Section>

      {/* 05 — server component */}
      <Section n="05" title="Run it — a Server Component">
        <p className="prose-text">
          A server component is an async function. Run an effect to its data with{" "}
          <Code>runPromise</Code>; the services are injected from the runtime, so
          the component body stays declarative.
        </p>
        <CodeFrame {...snip["run-rsc"]} filename="app/user-card.tsx" lang="ts" />
      </Section>

      {/* 06 — route handler */}
      <Section n="06" title="Run it — a Route Handler">
        <p className="prose-text">
          Same runtime, different entry point: run the effect and build the{" "}
          <Code>Response</Code>. The handler never knows how the services were
          constructed — it just asks the runtime to run.
        </p>
        <CodeFrame {...snip["run-route"]} filename="app/api/users/route.ts" lang="ts" />
      </Section>

      {/* 07 — server action */}
      <Section n="07" title="Run it — a Server Action">
        <p className="prose-text">
          In a server action, reach for <Code>runPromiseExit</Code>: both
          layer-construction and effect failures come back as a typed{" "}
          <Code>Exit</Code> you branch on, instead of a thrown error crossing the
          server/client boundary.
        </p>
        <CodeFrame {...snip["run-action"]} filename="app/actions.ts" lang="ts" />
        <p className="prose-text">The full set of runners, by what they return:</p>
        <CodeFrame {...menu.runners} filename="ManagedRuntime" lang="ts" />
        <ModuleNote module="ManagedRuntime">
          The layer&apos;s construction error <Code>ER</Code> is folded into the
          error channel of every <Code>*Exit</Code> runner — so a failed DB
          connection surfaces in the same <Code>Exit</Code> as your effect&apos;s
          own errors, not as a surprise throw.
        </ModuleNote>
      </Section>

      {/* 08 — lifecycle */}
      <Section n="08" title="Background work & shutdown">
        <p className="prose-text">
          <Code>runFork</Code> launches a long-lived effect without awaiting it —
          warmups, subscriptions, background loops. <Code>dispose</Code> closes
          the runtime&apos;s scope and releases every resource the layer acquired;
          wire it to your process shutdown hook.
        </p>
        <CodeFrame {...snip.lifecycle} filename="lib/runtime.ts" lang="ts" />
        <Callout label="One scope to close">
          Because the runtime owns the layer&apos;s scope, a single{" "}
          <Code>dispose()</Code> tears down pools, file handles, and forked fibers
          together — no per-resource cleanup bookkeeping.
        </Callout>
      </Section>

      {/* Capstone */}
      <section className="mt-28">
        <Reveal>
          <p className="text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">
            Putting it together
          </p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-gradient">lib/runtime.ts</span>, the module
            everything imports
          </h2>
          <p className="mt-4 prose-text">
            Swap the stub layers for your real ones — a{" "}
            <Link href="/backend/sql-reference" className="text-cyan hover:underline">
              SqlClient layer
            </Link>
            , a logger, config from env — keep the singleton, and expose one typed{" "}
            <Code>runEffect</Code> helper so call sites never touch{" "}
            <Code>ManagedRuntime</Code> directly.
          </p>
        </Reveal>
        <div className="mt-8 space-y-5">
          <CodeFrame {...snip.capstone} filename="lib/runtime.ts" lang="ts" />
          <Quote label="That's the whole point">
            One layer, one runtime, one import. Your services are built once and
            shared everywhere; every call site is a typed one-liner; and a single{" "}
            <Code>dispose</Code> shuts the whole thing down cleanly.
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

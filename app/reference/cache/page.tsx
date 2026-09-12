import Link from "next/link"
import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Cache & batching — Effect reference",
  description:
    "Two ways to stop doing the same work twice: a Cache that remembers results across calls, and request batching that collapses many concurrent lookups into a single round-trip — the cure for the N+1 query."
}

const FILE = "reference/cache.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["cache", "refresh", "batch"])

  return (
    <>
      <Hero
        eyebrow="Reference · field guide"
        title={<>Cache &amp; <span className="text-gradient">batching</span></>}
        intro={
          <>
            Two ways to stop doing the same work twice. A <Code>Cache</Code>{" "}
            <em>remembers</em> results across calls, keyed by input. Request
            batching <em>collapses</em> many lookups happening at once into a
            single round-trip — the cure for the N+1 query. Both keep your code
            written one call at a time.
          </>
        }
      >
        <Quote label="Repeated vs. concurrent">
          A <span className="text-cyan">cache</span> skips work you&apos;ve already
          done. <span className="text-cyan">Batching</span> fuses work you&apos;re
          doing right now. Different problems, both solved without restructuring
          the caller.
        </Quote>
      </Hero>

      {/* Cache */}
      <Section n="01" title="Cache — remember the answer">
        <p className="prose-text">
          <Code>Cache.make</Code> wraps a <Code>lookup</Code> (any{" "}
          <Code>key → Effect</Code>) with memoization: a hit returns the stored
          value, a miss runs the lookup once, and concurrent misses for the{" "}
          <em>same</em> key share one in-flight lookup. <Code>capacity</Code> is
          required and bounds entries, evicting the oldest-inserted first — a hit
          does not move an entry to the back. <Code>timeToLive</Code> expires
          them.
        </p>
        <CodeFrame {...snip.cache} filename="cache.ts" lang="ts" />
        <Callout label="One miss, not a thundering herd">
          Ask for an uncached key from a hundred fibers at once and the lookup runs{" "}
          <em>once</em> — the other ninety-nine await the same result. Deduplication
          is built into <Code>get</Code>.
        </Callout>
        <Callout label="No key to cache by?">
          <Code>Effect.cachedWithTTL(effect, &quot;5 minutes&quot;)</Code> memoizes
          a single effect with no key at all. Reach for <Code>Cache</Code> when the
          result varies by input.
        </Callout>
        <ModuleNote module="Cache">
          More: <Code>getOption</Code> (read without triggering a lookup),{" "}
          <Code>set</Code>, <Code>has</Code>, <Code>invalidateAll</Code>,{" "}
          <Code>invalidateWhen</Code>, <Code>size</Code>, and <Code>keys</Code> /{" "}
          <Code>values</Code> / <Code>entries</Code>.
        </ModuleNote>
      </Section>

      {/* Refresh */}
      <Section n="02" title="Keep entries fresh">
        <p className="prose-text">
          Stale beats slow — but only briefly. <Code>refresh</Code> recomputes a
          key <em>without</em> evicting it, so other readers keep getting the old
          value until the new one lands. The caller of <Code>refresh</Code> waits
          for that recompute — fork it when you want fire-and-forget.{" "}
          <Code>invalidate</Code> drops an entry so the next read recomputes.
        </p>
        <CodeFrame {...snip.refresh} filename="cache.ts" lang="ts" />
        <ModuleNote module="Cache / ScopedCache">
          <Code>ScopedCache</Code> is the resourceful sibling: each entry owns a{" "}
          <Link href="/reference/scope" className="text-cyan hover:underline">
            Scope
          </Link>
          , so eviction releases what the entry acquired — a connection, a file
          handle — not just the value.
        </ModuleNote>
      </Section>

      {/* Batch */}
      <Section n="03" title="Batching — collapse the N+1">
        <p className="prose-text">
          Caching skips <em>repeated</em> work; batching fuses{" "}
          <em>concurrent</em> work. Model the lookup as a <Code>Request</Code>,
          write a <Code>RequestResolver</Code> that handles a whole{" "}
          <strong>batch</strong> at once, and Effect gathers every request issued
          together into one call — a hundred <Code>getUser</Code>s become a single{" "}
          <Code>WHERE id IN (…)</Code>.
        </p>
        <CodeFrame {...snip.batch} filename="cache.ts" lang="ts" />
        <Quote label="The N+1, designed out">
          You write the loop as if each lookup were independent; the resolver sees
          them as a set. The naive shape and the efficient execution stop being in
          tension.
        </Quote>
      </Section>
    </>
  )
}

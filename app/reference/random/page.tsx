import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero } from "@/app/_components/LessonShell"
import { Callout, Code, Quote, Section } from "@/app/_components/Prose"

export const metadata: Metadata = {
  title: "Random — Effect reference",
  description:
    "Randomness in Effect is read from the Random service, not a global Math.random(). In production it's a real PRNG; a test can pin a seed and get the exact same sequence every run — the same testability story as Clock."
}

const FILE = "reference/random.ts"

export default async function Page() {
  const snip = await highlightRegions(FILE, ["draw", "deterministic", "shuffle"])

  return (
    <>
      <Hero
        eyebrow="Reference · field guide"
        title={<>Random</>}
        intro={
          <>
            Randomness in Effect is read from the <Code>Random</Code>{" "}
            <em>service</em>, not a global <Code>Math.random()</Code>. That one
            indirection is the whole point: in production it&apos;s a real PRNG, but
            a test can pin a seed and get the exact same sequence every run.
          </>
        }
      >
        <Quote label="Same idea as the Clock">
          A program that reads time or randomness from a service is a program a test
          can <span className="text-cyan">control</span>. Pin the seed and
          &ldquo;random&rdquo; becomes reproducible — flaky tests, gone.
        </Quote>
      </Hero>

      {/* Draw */}
      <Section n="01" title="Draw values">
        <p className="prose-text">
          Each draw is an Effect. <Code>next</Code> is a float in{" "}
          <Code>[0, 1)</Code>; <Code>nextIntBetween</Code> is an inclusive integer
          range; <Code>nextBoolean</Code> flips a coin. Because they go through the
          service, they compose like any other effect.
        </p>
        <CodeFrame {...snip.draw} filename="random.ts" lang="ts" />
      </Section>

      {/* Deterministic */}
      <Section n="02" title="Pin a seed for tests">
        <p className="prose-text">
          The payoff: <Code>Random.withSeed</Code> provides a seeded generator for
          the wrapped effect. Same seed → same sequence, every time — so a test
          asserting on random output is reproducible instead of flaky. Swap the
          service, not the code.
        </p>
        <CodeFrame {...snip.deterministic} filename="random.ts" lang="ts" />
        <Callout label="Seeded, not secure">
          A seeded PRNG is for reproducibility, not secrets. For tokens or
          passwords reach for a cryptographic source — predictable-by-design is the
          opposite of what you want there.
        </Callout>
      </Section>

      {/* Shuffle */}
      <Section n="03" title="Shuffle & pick">
        <p className="prose-text">
          <Code>Random.shuffle</Code> reorders any iterable through the same
          service — so a shuffled deck is reproducible under a seed too. Here:
          shuffle, then deal the top three.
        </p>
        <CodeFrame {...snip.shuffle} filename="random.ts" lang="ts" />
        <Quote label="One service, many draws">
          Every draw in a wrapped effect comes from the same seeded generator, in
          order — so the whole computation, not just one call, replays identically.
          It&apos;s the same trick the <Code>Clock</Code> uses to make time testable.
        </Quote>
      </Section>
    </>
  )
}

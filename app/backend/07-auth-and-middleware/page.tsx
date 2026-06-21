import type { Metadata } from "next"
import { highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { Callout, Code, ModuleNote, Quote, Section } from "@/app/_components/Prose"
import { lessonBySlug } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "07 · Auth & middleware — Effect backend",
  description:
    "An HttpApi middleware that reads a bearer token, injects the caller as a typed service, and rejects with 401 — then authorize with a 403 ownership check. Authentication and authorization, kept separate."
}

const FILE = "backend/07-auth-and-middleware.ts"
const LESSON = lessonBySlug("07-auth-and-middleware")

export default async function Lesson() {
  const snip = await highlightRegions(FILE, [
    "scheme",
    "middleware",
    "implement",
    "protect",
    "authorize",
    "serve"
  ])

  return (
    <>
      <Hero
        eyebrow={`Backend · Lesson ${LESSON.n}`}
        title={<>Auth &amp; <span className="text-gradient">middleware</span></>}
        intro={
          <>
            Most endpoints shouldn&apos;t run for just anyone. A middleware answers
            the question once, declaratively: read a credential, turn it into a
            typed &ldquo;who is calling&rdquo; service, and fail with a{" "}
            <Code>401</Code> when it&apos;s missing or bad — so every protected
            handler simply <em>asks</em> for the caller and trusts it.
          </>
        }
      >
        <Quote label="Two different questions">
          <span className="text-cyan">Authentication</span> is <em>who are you</em>{" "}
          — a 401 when unanswered. <span className="text-cyan">Authorization</span>{" "}
          is <em>may you do this</em> — a 403 when the answer is no. Keep them
          apart; a valid token is not a permission.
        </Quote>
      </Hero>

      {/* Q1 — the scheme */}
      <Section n="Q1" title="What credential, and who is the caller?">
        <p className="prose-text">
          Two pieces. <Code>HttpApiSecurity.bearer</Code> describes the credential
          — an <Code>Authorization: Bearer</Code> header, decoded for you as a{" "}
          <Code>Redacted</Code> so the token never lands in a log or a stack trace.{" "}
          <Code>CurrentUser</Code> is the service the middleware will{" "}
          <em>provide</em> to handlers once it trusts that token.
        </p>
        <CodeFrame {...snip.scheme} filename="auth.ts" lang="ts" />
        <Callout label="Redacted by construction">
          A bearer credential arrives as <Code>Redacted&lt;string&gt;</Code>. You
          unwrap it only to verify — it won&apos;t print itself, so it can&apos;t
          leak through a stray <Code>console.log</Code> or an error report.
        </Callout>
      </Section>

      {/* Q2 — the contract */}
      <Section n="Q2" title="How do I declare the middleware?">
        <p className="prose-text">
          <Code>HttpApiMiddleware.Service</Code> states the contract: which{" "}
          <Code>security</Code> scheme it reads, what it <Code>provides</Code>, and
          the typed <Code>error</Code> it fails with.{" "}
          <Code>HttpApiError.Unauthorized</Code> already carries a 401 on the wire
          — no status to set by hand.
        </p>
        <CodeFrame {...snip.middleware} filename="auth.ts" lang="ts" />
      </Section>

      {/* Q3 — the implementation */}
      <Section n="Q3" title="How do I verify the token?">
        <p className="prose-text">
          The implementation is a <Code>Layer</Code> keyed by scheme name. It
          receives the decoded <Code>credential</Code> and either{" "}
          <em>provides</em> <Code>CurrentUser</Code> to the wrapped handler or
          fails with 401 — and that single failure rejects every protected route
          at the door.
        </p>
        <CodeFrame {...snip.implement} filename="auth.ts" lang="ts" />
        <Callout label="This check is a placeholder">
          The string comparison stands in for real verification. Production code
          must verify before it trusts — a JWT signature check or a session lookup
          — and treat any failure as <Code>Unauthorized</Code>. Never trust a
          token you haven&apos;t validated.
        </Callout>
      </Section>

      {/* Q4 — protect */}
      <Section n="Q4" title="How do I protect routes?">
        <p className="prose-text">
          Attach the middleware to a <Code>group</Code> and every endpoint in it
          is guarded at once. The endpoints declare their own failures too:{" "}
          <Code>Forbidden</Code> (403) is for an authenticated caller who
          isn&apos;t <em>allowed</em> — distinct from 401.
        </p>
        <CodeFrame {...snip.protect} filename="api.ts" lang="ts" />
      </Section>

      {/* Q5 — authorize */}
      <Section n="Q5" title="How do I authorize, not just authenticate?">
        <p className="prose-text">
          Because the middleware ran first, handlers just{" "}
          <Code>yield* CurrentUser</Code> — no header parsing here. Authentication
          is done; now do <strong>authorization</strong>: check this caller may
          touch <em>this</em> resource. Owning it, or being an admin, is allowed;
          anything else is a 403.
        </p>
        <CodeFrame {...snip.authorize} filename="handlers.ts" lang="ts" />
        <Quote label="Broken access control is the #1 risk">
          A valid token says who you are, never what you may touch. Check
          ownership on every protected resource — the alternative is any logged-in
          user reading any record by guessing an id.
        </Quote>
      </Section>

      {/* Q6 — serve */}
      <Section n="Q6" title="How do I wire it together?">
        <p className="prose-text">
          The API layer, the group handlers, and the auth implementation. The
          middleware&apos;s requirement is satisfied once, at the edge — provide a
          different implementation in a test and every route is authenticated by
          the double instead, with no handler changing.
        </p>
        <CodeFrame {...snip.serve} filename="server.ts" lang="ts" />
        <ModuleNote module="HttpApiSecurity">
          Beyond <Code>bearer</Code>: <Code>apiKey</Code> (header, query, or
          cookie) and <Code>basic</Code>. The same middleware shape carries each —
          declare the scheme, receive its decoded credential.
        </ModuleNote>
      </Section>

      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

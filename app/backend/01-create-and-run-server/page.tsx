import type { Metadata } from "next"
import { highlight, highlightRegions } from "@/lib/code"
import { CodeFrame } from "@/app/_components/CodeFrame"
import { Hero, LessonNav } from "@/app/_components/LessonShell"
import { ScrollStack, type StackItem } from "@/app/_components/ScrollStack"
import { RuntimeToggle, type RuntimeVariant } from "@/app/_components/RuntimeToggle"
import { Section, Callout, ModuleNote, Code } from "@/app/_components/Prose"
import { lessonBySlug } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "01 · Create & run a server — Effect backend",
  description: "Spin up and run your first HTTP server with Effect v4."
}

const FILE = "backend/01-create-and-run-server.ts"
const LESSON = lessonBySlug("01-create-and-run-server")

export default async function Lesson() {
  // File-backed snippets (shown code === copied code, kept honest by typecheck).
  const snip = await highlightRegions(FILE, [
    "route",
    "handler-gen",
    "handler-fn",
    "handler-pipe",
    "server-node",
    "server-bun"
  ])
  // Terminal snippets show an annotated command but copy only the bare command.
  const [pkgHtml, curlHtml] = await Promise.all([
    highlight("pnpm add effect @effect/platform-node\n# Bun runtime (optional): pnpm add @effect/platform-bun", "bash"),
    highlight("curl localhost:3000\n# → Hello from Effect!", "bash")
  ])

  const stack: StackItem[] = [
    {
      id: "gen",
      badge: "Effect.gen",
      title: "The generator style",
      ...snip["handler-gen"],
      filename: "handler.ts",
      desc: "Sequential and readable, like async/await. Reach for it once a handler has more than one step. Adjacent: Effect.succeed, Effect.flatMap, Effect.tap."
    },
    {
      id: "fn",
      badge: "Effect.fn",
      title: "The named, traced style",
      ...snip["handler-fn"],
      filename: "handler.ts",
      desc: "Same body, but it receives the request and emits a span named \"hello\" for tracing. Use Effect.fnUntraced when you want the function form without the span."
    },
    {
      id: "pipe",
      badge: "pipe",
      title: "The point-free style",
      ...snip["handler-pipe"],
      filename: "handler.ts",
      desc: "Compose with combinators — no generator. Best for short, branch-free handlers. Adjacent: Effect.map, Effect.as, Effect.zipRight, Effect.tap."
    }
  ]

  const runtimes: RuntimeVariant[] = [
    {
      id: "node",
      label: "Node",
      ...snip["server-node"],
      filename: "server.ts",
      note: "NodeHttpServer.layer binds a Node http.Server to the port; Layer.launch keeps it alive; NodeRuntime.runMain wires up Ctrl+C and error logging."
    },
    {
      id: "bun",
      label: "Bun",
      ...snip["server-bun"],
      filename: "server.ts",
      note: "The app layer is identical — only the platform layer and runtime change. BunHttpServer.layer needs no createServer; Bun.serve owns the socket. Run it with `bun server.ts`."
    }
  ]

  return (
    <>
      {/* Hero */}
      <Hero
        eyebrow={`Backend · Lesson ${LESSON.n}`}
        title={<>Create <span className="text-gradient">&amp; run</span> a server</>}
        intro={
          <>
            The very first question: how do I stand up an HTTP server in Effect, and
            how do I actually run it? Let&apos;s answer that — and every small question
            hiding inside it.
          </>
        }
      />

      {/* Q1 — packages */}
      <Section n="Q1" title="What do I need to install?">
        <p className="prose-text">
          An Effect backend needs the core <Code>effect</Code> package plus a{" "}
          <em>platform</em> for the runtime you target.
        </p>
        <CodeFrame html={pkgHtml} code="pnpm add effect @effect/platform-node" filename="terminal" lang="bash" />
        <Callout label="Heads-up">
          In Effect v4 the HTTP modules live in <Code>effect/unstable/http</Code> —
          there is <strong>no</strong> v4 <Code>@effect/platform</Code> package. The{" "}
          <Code>unstable/</Code> path is intentional: these APIs can still change
          between beta releases.
        </Callout>
      </Section>

      {/* Q2 — first route */}
      <Section n="Q2" title="How do I add my first route?">
        <p className="prose-text">
          A route is just a <strong>Layer</strong> that registers one handler with the
          router. <Code>HttpServerResponse.text(...)</Code> builds a plain-text reply.
        </p>
        <CodeFrame {...snip.route} filename="route.ts" lang="ts" />
        <ModuleNote module="HttpRouter">
          <Code>addAll([...])</Code> for many routes, <Code>route()</Code> to build a
          route value, <Code>prefixPath</Code> to mount a group under a path,{" "}
          <Code>cors()</Code> / <Code>middleware()</Code> for cross-cutting concerns,
          and <Code>schemaJson</Code> / <Code>schemaParams</Code> to decode the body
          &amp; params.
        </ModuleNote>
      </Section>

      {/* Q3 — the handler, three ways (STACK) */}
      <Section
        n="Q3 · same handler, three ways"
        title={<>How do I write the handler — <span className="text-gradient">gen, fn, or pipe?</span></>}
        after={
          <div className="mt-10">
            <ScrollStack items={stack} />
          </div>
        }
      >
        <p className="prose-text">
          All three produce the identical <Code>Effect&lt;HttpServerResponse&gt;</Code>.
          Scroll — each style stacks over the last.
        </p>
      </Section>

      {/* Q4 — run it (TOGGLE) */}
      <Section n="Q4" title="How do I run it — and on Bun too?">
        <p className="prose-text">
          Provide a platform server layer to the app, then launch it as your program&apos;s
          main effect. Switching runtimes only swaps two imports.
        </p>
        <RuntimeToggle variants={runtimes} />
      </Section>

      {/* Q5 — verify */}
      <Section n="Q5" title="How do I know it works?">
        <p className="prose-text">
          Start it (<Code>npx tsx server.ts</Code> or <Code>bun server.ts</Code>) and hit
          the port:
        </p>
        <CodeFrame html={curlHtml} code="curl localhost:3000" filename="terminal" lang="bash" />
        <Callout label="Graceful shutdown — free">
          <Code>runMain</Code> listens for <Code>SIGINT</Code>/<Code>SIGTERM</Code>, so
          Ctrl+C interrupts the fiber and the server layer&apos;s scope closes the socket
          for you. No manual cleanup.
        </Callout>
      </Section>

      {/* Next */}
      <LessonNav currentSlug={LESSON.slug} />
    </>
  )
}

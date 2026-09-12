/* Single source of truth for every page the home index links to: the
   sequential lessons, the whole-map references (both under /backend), and the
   field guides (under /reference). Pages look themselves up here so titles,
   numbering, and routes can never drift apart. */

export type CatalogPage = {
  /** Route segment, and the example filename stem. */
  slug: string
  /** Full route, derived from the slug — use this for links. */
  href: string
  title: string
  desc: string
  /** Whether the page exists yet. Unready entries render as disabled cards. */
  ready: boolean
}

export type Lesson = CatalogPage & {
  /** Index marker — "01", "02", … `nextLesson` walks the lessons in order. */
  n: string
}

const lessonData = [
  {
    slug: "01-create-and-run-server",
    n: "01",
    title: "Create & run a server",
    desc: "Your first HTTP server, the handler three ways, Node ⇄ Bun.",
    ready: true
  },
  {
    slug: "02-endpoints-and-responses",
    n: "02",
    title: "Endpoints & responses",
    desc: "JSON, status codes, headers, reading the request body.",
    ready: true
  },
  {
    slug: "03-schemas",
    n: "03",
    title: "Schemas: payload, response, errors",
    desc: "Validate input and model failures as data.",
    ready: true
  },
  {
    slug: "04-services-and-layers",
    n: "04",
    title: "Services & layers",
    desc: "Ask for a dependency; build it with a Layer; swap it for tests.",
    ready: true
  },
  {
    slug: "05-talking-to-a-database",
    n: "05",
    title: "Talking to a database",
    desc: "A safe SQL client, typed queries, and a repository service.",
    ready: true
  },
  {
    slug: "06-testing-your-backend",
    n: "06",
    title: "Testing your backend",
    desc: "Swap a fake Layer, assert on the Exit, and drive time with TestClock.",
    ready: true
  },
  {
    slug: "07-auth-and-middleware",
    n: "07",
    title: "Auth & middleware",
    desc: "Read a bearer token, inject the caller, reject with 401 — authorize with 403.",
    ready: true
  },
  {
    slug: "08-background-work-and-scheduling",
    n: "08",
    title: "Background work & scheduling",
    desc: "Fork off the request path, repeat on a schedule or cron, shut down cleanly.",
    ready: true
  },
  {
    slug: "09-observability",
    n: "09",
    title: "Observability",
    desc: "Structured logs, traced spans, and metrics — the three pillars, built in.",
    ready: true
  }
] as const

const wholeMapData = [
  {
    slug: "http-reference",
    title: "http — the whole map",
    desc: "Request, response, router, middleware, errors, cookies, client — the server toolkit.",
    ready: true
  },
  {
    slug: "httpapi-reference",
    title: "HttpApi — the whole map",
    desc: "One contract → server, typed client, URL builder, OpenAPI docs, tests.",
    ready: true
  },
  {
    slug: "sql-reference",
    title: "sql — the whole map",
    desc: "Safe queries, typed schemas, batched resolvers, models, migrations, errors.",
    ready: true
  },
  {
    slug: "global-runtime",
    title: "Global runtime — one source of truth",
    desc: "One ManagedRuntime from your app layer, run from RSCs, route handlers, actions.",
    ready: true
  }
] as const

const fieldGuideData = [
  {
    slug: "effect",
    title: "The Effect type",
    desc: "Build, sequence, transform, and run the description at the heart of everything.",
    ready: true
  },
  {
    slug: "cause-exit",
    title: "Exit & Cause",
    desc: "How an Effect ends, as a value — success, typed failure, defect, or interruption.",
    ready: true
  },
  {
    slug: "errors",
    title: "Fail & recover",
    desc: "Typed errors vs defects, catching by tag, folding to a value, and retry policies.",
    ready: true
  },
  {
    slug: "layers",
    title: "Layers & Context",
    desc: "Typed dependency injection — define a service, build it with a Layer, provide it.",
    ready: true
  },
  {
    slug: "concurrency",
    title: "Concurrency",
    desc: "Run effects together, race, time out, and fork fibers — structured by default.",
    ready: true
  },
  {
    slug: "stream",
    title: "Stream",
    desc: "A lazy, resource-safe sequence of many values — build, transform, and run it.",
    ready: true
  },
  {
    slug: "option-result",
    title: "Option & Result",
    desc: "Values that might be absent or failed — and the combinators they share.",
    ready: true
  },
  {
    slug: "data-match",
    title: "Data & Match",
    desc: "Value equality, tagged unions, and exhaustive pattern matching.",
    ready: true
  },
  {
    slug: "ref-queue",
    title: "Ref & Queue",
    desc: "Fiber-safe state and messaging — an atomic cell and an async channel.",
    ready: true
  },
  {
    slug: "scope",
    title: "Scope & resources",
    desc: "Acquire/release with guaranteed cleanup, and resourceful services via Layer.",
    ready: true
  },
  {
    slug: "config",
    title: "Config",
    desc: "Typed, composable configuration — declared, nested, and read as an Effect.",
    ready: true
  },
  {
    slug: "schedule",
    title: "Schedule",
    desc: "Reusable repetition policies for retry and repeat — backoff, jitter, caps.",
    ready: true
  },
  {
    slug: "time",
    title: "Time",
    desc: "Duration, DateTime, and a Clock you can fake — spans, instants, a testable now.",
    ready: true
  },
  {
    slug: "cache",
    title: "Cache & batching",
    desc: "Memoize results with a Cache; collapse the N+1 with request batching.",
    ready: true
  },
  {
    slug: "schema",
    title: "Schema — the whole map",
    desc: "One value: a type, a decoder, an encoder, a constructor. Structs, checks, transforms, brands, unions.",
    ready: true
  },
  {
    slug: "coordination",
    title: "Coordination & limits",
    desc: "Semaphore, Deferred, Latch, Pool — limit concurrency, hand off a value, gate fibers, share resources.",
    ready: true
  },
  {
    slug: "pubsub",
    title: "PubSub",
    desc: "Broadcast each message to every subscriber — the fan-out sibling of Queue.",
    ready: true
  },
  {
    slug: "stm",
    title: "Transactions — Effect.tx & Tx*",
    desc: "Lock-free shared state — read and write transactional values in one atomic, self-retrying Effect.tx.",
    ready: true
  },
  {
    slug: "collections",
    title: "Immutable collections",
    desc: "Persistent Chunk, HashMap, and HashSet — keyed by value, copied cheaply, safe across fibers.",
    ready: true
  },
  {
    slug: "random",
    title: "Random",
    desc: "Randomness as a service — real in production, seedable and reproducible in a test.",
    ready: true
  }
] as const

const frontendData = [
  {
    slug: "10-state-in-the-browser",
    n: "10",
    title: "State in the browser",
    desc: "An Atom is reactive state; read it and write it from React with hooks.",
    ready: true
  },
  {
    slug: "11-async-state",
    n: "11",
    title: "Async state",
    desc: "AsyncResult carries waiting alongside the value — stale data stays on screen.",
    ready: true
  },
  {
    slug: "12-services-in-the-browser",
    n: "12",
    title: "Services in the browser",
    desc: "Atom.runtime gives atoms a Layer — the same swap that made the backend testable.",
    ready: true
  },
  {
    slug: "13-one-contract-both-ends",
    n: "13",
    title: "One contract, both ends",
    desc: "Turn the HttpApi from Lesson 07 into query and mutation atoms. No codegen.",
    ready: false
  },
  {
    slug: "14-rendering-in-nextjs",
    n: "14",
    title: "Rendering in Next.js",
    desc: "Server-render the first paint, then hand the same atoms to the client.",
    ready: false
  }
] as const

/** Slug unions derived from the data, so icon maps etc. are compiler-checked. */
export type LessonSlug = (typeof lessonData)[number]["slug"]
export type WholeMapSlug = (typeof wholeMapData)[number]["slug"]
export type FieldGuideSlug = (typeof fieldGuideData)[number]["slug"]
export type FrontendSlug = (typeof frontendData)[number]["slug"]

/** The sequential backend lessons, in order. `nextLesson` walks this list. */
export const lessons = lessonData.map((l) => ({
  ...l,
  href: `/backend/${l.slug}`
})) satisfies readonly Lesson[]

/** Out-of-sequence whole-map pages: listed on the index, not in the next-chain. */
export const wholeMaps = wholeMapData.map((p) => ({
  ...p,
  href: `/backend/${p.slug}`
})) satisfies readonly CatalogPage[]

/** The sequential frontend lessons, in order — their own chain, continuing the
    numbering from the backend track. */
export const frontendLessons = frontendData.map((l) => ({
  ...l,
  href: `/frontend/${l.slug}`
})) satisfies readonly Lesson[]

/** The reference field guides under /reference. */
export const fieldGuides = fieldGuideData.map((p) => ({
  ...p,
  href: `/reference/${p.slug}`
})) satisfies readonly CatalogPage[]

/**
 * Look up a lesson by its (compiler-checked) slug. Throws on a stale slug so a
 * renamed lesson fails the static build instead of 404ing at click time.
 */
export function lessonBySlug(slug: LessonSlug): Lesson {
  const lesson = lessons.find((l) => l.slug === slug)
  if (!lesson) throw new Error(`lib/catalog: unknown lesson slug "${slug}"`)
  return lesson
}

/** Same, for the frontend track. */
export function frontendLessonBySlug(slug: FrontendSlug): Lesson {
  const lesson = frontendLessons.find((l) => l.slug === slug)
  if (!lesson) throw new Error(`lib/catalog: unknown frontend slug "${slug}"`)
  return lesson
}

/**
 * The lesson after `slug`, within its own track. The two tracks are separate
 * chains: backend ends at 09 rather than spilling into the frontend lessons,
 * and each track's last lesson terminates.
 */
export function nextLesson(slug: string): Lesson | undefined {
  for (const track of [lessons, frontendLessons]) {
    const i = track.findIndex((l) => l.slug === slug)
    if (i >= 0) return track[i + 1]
  }
  return undefined
}

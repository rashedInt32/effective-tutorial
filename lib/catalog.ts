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
    title: "Option & Either (Result)",
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
  }
] as const

/** Slug unions derived from the data, so icon maps etc. are compiler-checked. */
export type LessonSlug = (typeof lessonData)[number]["slug"]
export type WholeMapSlug = (typeof wholeMapData)[number]["slug"]
export type FieldGuideSlug = (typeof fieldGuideData)[number]["slug"]

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

/** The lesson after `slug` in the sequential chain, if any. */
export function nextLesson(slug: string): Lesson | undefined {
  const i = lessons.findIndex((l) => l.slug === slug)
  return i >= 0 ? lessons[i + 1] : undefined
}

/* Single source of truth for the lesson catalog. The home index, the per-page
   hero eyebrows, and the "next lesson" footer all read from here so titles and
   routes can never drift apart. */

export type Lesson = {
  /** Route segment under /backend, and the example filename stem. */
  slug: string
  /** Index marker — "01", "02", or "★" for the reference. */
  n: string
  title: string
  desc: string
  /** Whether the page exists yet. Unready lessons render as disabled cards. */
  ready: boolean
}

/** The sequential backend lessons, in order. `nextLesson` walks this list. */
export const lessons: readonly Lesson[] = [
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
  }
]

/** Out-of-sequence reference pages: listed on the index, not in the next-chain. */
export const references: readonly Lesson[] = [
  {
    slug: "http-reference",
    n: "★",
    title: "http — the whole map",
    desc: "Request, response, router, middleware, errors, cookies, client — the server toolkit.",
    ready: true
  },
  {
    slug: "httpapi-reference",
    n: "★",
    title: "HttpApi — the whole map",
    desc: "One contract → server, typed client, URL builder, OpenAPI docs, tests.",
    ready: true
  }
]

/** Everything shown on the home index, in display order. */
export const indexCards: readonly Lesson[] = [...lessons, ...references]

export const lessonHref = (slug: string) => `/backend/${slug}`

/** The lesson after `slug` in the sequential chain, if any. */
export function nextLesson(slug: string): Lesson | undefined {
  const i = lessons.findIndex((l) => l.slug === slug)
  return i >= 0 ? lessons[i + 1] : undefined
}

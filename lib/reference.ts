/* Single source of truth for the reference "field guide" — pages that map a
   slice of the Effect v4 API: what it is, the few functions you actually reach
   for, and when to use them. Grounded in the installed package, kept separate
   from the sequential lessons. */

export type ReferencePage = {
  /** Route segment under /reference, and the example filename stem. */
  slug: string
  title: string
  desc: string
  ready: boolean
}

export const referencePages: readonly ReferencePage[] = [
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
  }
]

export const referenceHref = (slug: string) => `/reference/${slug}`

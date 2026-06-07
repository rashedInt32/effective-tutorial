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
    slug: "option-result",
    title: "Option & Either (Result)",
    desc: "Values that might be absent or failed — and the combinators they share.",
    ready: true
  }
]

export const referenceHref = (slug: string) => `/reference/${slug}`

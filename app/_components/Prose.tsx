import type { ReactNode } from "react"
import { Reveal } from "@/app/_components/Reveal"

/* Shared prose primitives for the lesson + reference pages. Kept here so the
   three backend pages render identical chrome from one source. */

/** A numbered lesson section with an animated heading. */
export function Section({
  n,
  title,
  children
}: {
  n: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="mt-24">
      <Reveal>
        <p className="text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">{n}</p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        <div className="mt-6 space-y-5">{children}</div>
      </Reveal>
    </section>
  )
}

/** A glass aside that calls out a single point. */
export function Callout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="glass p-5 text-sm leading-relaxed">
      <span className="font-semibold text-cyan">{label} · </span>
      <span className="text-muted">{children}</span>
    </div>
  )
}

/** A dashed note pointing at adjacent APIs in a module. */
export function ModuleNote({ module, children }: { module: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-5 text-sm leading-relaxed">
      <span className="font-mono text-violet">Also in {module}: </span>
      <span className="text-muted">{children}</span>
    </div>
  )
}

/** A pull-quote with a small mono label. */
export function Quote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <blockquote className="relative my-2 rounded-r-xl border-l-2 border-violet bg-gradient-to-r from-white/[0.05] to-transparent py-4 pl-5 pr-4 text-base leading-relaxed mt-6">
      <span className="block text-xs font-mono uppercase tracking-[0.2em] text-violet/90">
        {label}
      </span>
      <span className="mt-2 block text-muted">{children}</span>
    </blockquote>
  )
}

/** Inline code token. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-[0.85em] px-1.5 py-0.5 rounded bg-white/8 text-foreground">
      {children}
    </code>
  )
}

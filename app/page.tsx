import Link from "next/link"
import { Reveal } from "@/app/_components/Reveal"
import { indexCards, lessonHref } from "@/lib/lessons"
import { referencePages, referenceHref } from "@/lib/reference"

export default function Home() {
  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 py-24 sm:py-32">
      <Reveal>
        <p className="text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">
          Effect v4 · learn by doing
        </p>
        <h1 className="mt-5 text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
          Effect, <span className="text-gradient">on point.</span>
        </h1>
        <p className="mt-6 text-lg text-muted leading-relaxed max-w-xl">
          A backend (then frontend) built one real question at a time. No walls of
          theory — just &ldquo;how do I do X?&rdquo;, answered with code you can run, and a
          line you&apos;ll remember.
        </p>
      </Reveal>

      <div className="mt-16 space-y-4">
        {indexCards.map((l, i) => (
          <Reveal key={l.slug} delay={i * 0.06}>
            <CatalogRow
              href={lessonHref(l.slug)}
              marker={l.n}
              title={l.title}
              desc={l.desc}
              ready={l.ready}
            />
          </Reveal>
        ))}
      </div>

      <div className="mt-16">
        <p className="text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">
          Reference · field guide
        </p>
        <div className="mt-5 space-y-4">
          {referencePages.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <CatalogRow
                href={referenceHref(p.slug)}
                marker="{}"
                title={p.title}
                desc={p.desc}
                ready={p.ready}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  )
}

/** A glass index card — used for both lessons and reference pages. */
function CatalogRow({
  href,
  marker,
  title,
  desc,
  ready
}: {
  href: string
  marker: string
  title: string
  desc: string
  ready: boolean
}) {
  const inner = (
    <div className="glass group flex items-center gap-5 p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <span className="text-2xl font-mono font-bold text-gradient w-12 shrink-0">{marker}</span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {title}
          {!ready && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60 border border-border rounded-full px-2 py-0.5">
              soon
            </span>
          )}
        </h2>
        <p className="text-sm text-muted mt-1">{desc}</p>
      </div>
      {ready && (
        <span className="ml-auto text-muted group-hover:text-foreground transition-colors">→</span>
      )}
    </div>
  )

  return ready ? (
    <Link href={href}>{inner}</Link>
  ) : (
    <div className="opacity-55 cursor-not-allowed">{inner}</div>
  )
}

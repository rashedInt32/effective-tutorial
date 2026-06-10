import Link from "next/link"
import type { ReactNode } from "react"
import {
  Database,
  GitFork,
  Globe,
  Inbox,
  Layers,
  type LucideIcon,
  PackageOpen,
  Server,
  Shapes,
  ShieldAlert,
  SlidersHorizontal,
  Timer,
  Waves,
  Waypoints,
  Webhook,
  Zap
} from "lucide-react"
import { Reveal } from "@/app/_components/Reveal"
import {
  type FieldGuideSlug,
  fieldGuides,
  lessons,
  type WholeMapSlug,
  wholeMaps
} from "@/lib/catalog"

/* A fitting icon per reference card, keyed by slug. Lessons keep their numeral;
   the whole-map and field-guide cards each get a distinct topic icon. The key
   union makes the compiler reject a missing or stale slug. */
const ICONS: Record<WholeMapSlug | FieldGuideSlug, LucideIcon> = {
  // whole map
  "http-reference": Server,
  "httpapi-reference": Webhook,
  "sql-reference": Database,
  "global-runtime": Globe,
  // field guide
  effect: Zap,
  errors: ShieldAlert,
  layers: Layers,
  concurrency: Waypoints,
  stream: Waves,
  "option-result": GitFork,
  "data-match": Shapes,
  "ref-queue": Inbox,
  scope: PackageOpen,
  config: SlidersHorizontal,
  schedule: Timer
}

export default function Home() {
  return (
    <main className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:py-28">
      {/* Hero */}
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

      {/* Lessons — the sequential path */}
      <Group
        kicker="The path"
        title="Lessons"
        blurb="Work through them in order — each answers a question and builds on the last."
      >
        {lessons.map((l, i) => (
          <CatalogCard
            key={l.slug}
            href={l.href}
            mark={l.n}
            kind="Lesson"
            title={l.title}
            desc={l.desc}
            ready={l.ready}
            delay={i * 0.05}
          />
        ))}
      </Group>

      {/* Whole-map references */}
      <Group
        kicker="Field guides"
        title="The whole map"
        blurb="One dense page per module — every option you reach for, on the table at once."
      >
        {wholeMaps.map((l, i) => (
          <CatalogCard
            key={l.slug}
            href={l.href}
            Icon={ICONS[l.slug]}
            kind="Whole map"
            title={l.title}
            desc={l.desc}
            ready={l.ready}
            delay={i * 0.05}
          />
        ))}
      </Group>

      {/* Reference field guide */}
      <Group
        kicker="Reference"
        title="Field guide"
        blurb="Short, focused maps of the core API — what it is, the few combinators you actually use."
      >
        {fieldGuides.map((p, i) => (
          <CatalogCard
            key={p.slug}
            href={p.href}
            Icon={ICONS[p.slug]}
            kind="Guide"
            title={p.title}
            desc={p.desc}
            ready={p.ready}
            delay={i * 0.04}
          />
        ))}
      </Group>
    </main>
  )
}

/** A titled section with its eyebrow + blurb and a responsive box grid. */
function Group({
  kicker,
  title,
  blurb,
  children
}: {
  kicker: string
  title: string
  blurb: string
  children: ReactNode
}) {
  return (
    <section className="mt-20">
      <Reveal>
        <p className="text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">{kicker}</p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-muted max-w-2xl">{blurb}</p>
      </Reveal>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}

/** One box in the grid: a glassy card with a corner marker — a ghost numeral for
    lessons, or a topic icon for the reference cards. */
function CatalogCard({
  href,
  mark,
  Icon,
  kind,
  title,
  desc,
  ready,
  delay
}: {
  href: string
  mark?: string
  Icon?: LucideIcon
  kind: string
  title: string
  desc: string
  ready: boolean
  delay: number
}) {
  const body = (
    <>
      {Icon ? (
        <Icon
          aria-hidden
          strokeWidth={1.25}
          className="pointer-events-none absolute right-4 top-4 z-0 size-12 text-white/15 transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:text-violet"
        />
      ) : (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-3 right-1 z-0 select-none font-mono text-[5rem] font-extrabold leading-none tracking-tighter text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110 group-hover:[-webkit-text-stroke:1.5px_rgba(139,92,246,0.65)]"
        >
          {mark}
        </span>
      )}
      <div className="relative z-10 flex flex-1 flex-col">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan/70">
          {kind}
        </span>
        <h3 className="mt-3 text-lg font-semibold leading-snug flex items-center gap-2">
          {title}
          {!ready && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60 border border-border rounded-full px-2 py-0.5">
              soon
            </span>
          )}
        </h3>
        <p className="mt-2 text-sm text-muted leading-relaxed">{desc}</p>
        {ready && (
          <span className="mt-4 inline-flex items-center text-muted transition-colors group-hover:text-cyan">
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
        )}
      </div>
    </>
  )

  // Same surface as .glass but without backdrop-filter — 18 of these on the
  // home grid would each re-blur their backdrop, for no visible difference
  // over the near-black page.
  const cardClass =
    "relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-6"

  return (
    <Reveal delay={delay} className="h-full">
      {ready ? (
        <Link
          href={href}
          className={`group transition-all duration-300 hover:-translate-y-1 hover:border-violet/40 hover:shadow-[0_24px_60px_-36px_rgba(139,92,246,0.6)] ${cardClass}`}
        >
          {body}
        </Link>
      ) : (
        <div className={`cursor-not-allowed opacity-55 ${cardClass}`}>{body}</div>
      )}
    </Reveal>
  )
}

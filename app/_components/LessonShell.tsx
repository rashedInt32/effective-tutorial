import Link from "next/link"
import type { ReactNode } from "react"
import { Reveal } from "@/app/_components/Reveal"
import { lessonHref, nextLesson } from "@/lib/lessons"

/* Page chrome shared by every lesson + the reference page, so all three render
   an identical hero and footer from one source. */

/** The hero atop a lesson: back-link, eyebrow, title, intro, optional extras. */
export function Hero({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string
  title: ReactNode
  intro: ReactNode
  children?: ReactNode
}) {
  return (
    <Reveal>
      <Link
        href="/"
        className="text-sm font-mono text-muted hover:text-foreground transition-colors"
      >
        ← all lessons
      </Link>
      <p className="mt-8 text-sm font-mono uppercase tracking-[0.3em] text-cyan/80">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">{title}</h1>
      <p className="mt-5 text-lg text-muted leading-relaxed">{intro}</p>
      {children}
    </Reveal>
  )
}

/** The "next question →" footer. Renders nothing when there is no next lesson. */
export function LessonNav({ currentSlug }: { currentSlug: string }) {
  const next = nextLesson(currentSlug)
  if (!next) return null

  const label = `${next.n} · ${next.title} →`
  return (
    <div className="mt-28 border-t border-border pt-10">
      <p className="text-sm text-muted">Next question →</p>
      {next.ready ? (
        <Link
          href={lessonHref(next.slug)}
          className="mt-2 inline-block text-xl font-semibold text-foreground hover:text-cyan transition-colors"
        >
          {label}
        </Link>
      ) : (
        <p className="mt-2 text-xl font-semibold text-muted/60">
          {next.n} · {next.title}
        </p>
      )}
    </div>
  )
}

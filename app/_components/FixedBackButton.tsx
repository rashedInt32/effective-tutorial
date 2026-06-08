import Link from "next/link"

/**
 * Always-visible "back to all lessons" pill, fixed to the bottom-left. Mounted by
 * the /backend and /reference layouts so it rides along every detail page while
 * you scroll — without appearing on the home index itself.
 */
export function FixedBackButton() {
  return (
    <Link
      href="/"
      aria-label="Back to all lessons"
      className="group fixed bottom-5 left-5 z-50 inline-flex items-center gap-2 rounded-full glass px-4 py-2.5 text-muted shadow-lg shadow-black/30 transition-colors hover:text-foreground"
    >
      <span
        aria-hidden
        className="font-mono text-base leading-none transition-transform duration-300 group-hover:-translate-x-0.5"
      >
        ←
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.2em]">all lessons</span>
    </Link>
  )
}

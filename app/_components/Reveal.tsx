"use client"

import { type ReactNode, useEffect, useRef } from "react"

/**
 * Fade-and-rise a block into view on scroll. The content is fully visible in
 * the server HTML (no opacity:0 before hydration — LCP paints immediately and
 * the page works without JS). After mount, only blocks still below the fold
 * are hidden and animated in as they approach, via the CSS classes in
 * globals.css. Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  className
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Already on screen (or above it): leave it visible, no animation.
    if (el.getBoundingClientRect().top < window.innerHeight - 80) return

    el.style.animationDelay = `${delay}s`
    el.classList.add("reveal-pending")
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("reveal-in")
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -80px 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

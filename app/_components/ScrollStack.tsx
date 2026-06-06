"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "motion/react"
import { CodeFrame } from "./CodeFrame"

export type StackItem = {
  id: string
  title: string
  badge: string
  desc: string
  html: string
  code: string
  filename?: string
}

/**
 * Scroll-stacking deck. Each variant card is sticky at the same offset, so the
 * next card scrolls up and covers the previous one; covered cards scale and dim
 * slightly to read as a physical stack. Used only for "same logic, N ways"
 * sections (gen → fn → pipe). Everything else on the page scrolls normally.
 */
export function ScrollStack({ items }: { items: StackItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  return (
    <div ref={containerRef} className="relative">
      {items.map((item, i) => (
        <StackCard
          key={item.id}
          item={item}
          index={i}
          total={items.length}
          progress={scrollYProgress}
        />
      ))}
    </div>
  )
}

function StackCard({
  item,
  index,
  total,
  progress
}: {
  item: StackItem
  index: number
  total: number
  progress: MotionValue<number>
}) {
  // Each card recedes slightly once the NEXT card starts covering it — depth
  // via scale only, so the opaque sheet never turns see-through.
  const coverStart = (index + 1) / total
  const scale = useTransform(progress, [coverStart, 1], [1, 0.9])
  const isLast = index === total - 1

  return (
    <motion.div
      style={{
        scale: isLast ? 1 : scale,
        transformOrigin: "center top",
        zIndex: index + 1,
        top: `calc(6rem + ${index * 0.85}rem)`
      }}
      className="sticky"
    >
      {/* Opaque sheet so a covering card fully hides the one beneath it */}
      <div className="rounded-2xl bg-background p-6 sm:p-7 ring-1 ring-white/8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full border border-border bg-white/5 text-cyan">
            {item.badge}
          </span>
          <h3 className="text-lg font-semibold">{item.title}</h3>
        </div>
        <CodeFrame html={item.html} code={item.code} filename={item.filename} lang="ts" />
        <p className="mt-4 text-sm text-muted leading-relaxed">{item.desc}</p>
      </div>
    </motion.div>
  )
}

"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CodeFrame } from "./CodeFrame"

export type RuntimeVariant = {
  id: string
  label: string
  html: string
  code: string
  filename?: string
  note: string
}

/** A small toggle that swaps a code card between runtimes (Node ⇄ Bun). */
export function RuntimeToggle({ variants }: { variants: RuntimeVariant[] }) {
  const [active, setActive] = useState(variants[0].id)
  const current = variants.find((v) => v.id === active) ?? variants[0]

  return (
    <div>
      <div className="inline-flex p-1 rounded-full border border-border bg-white/5 mb-4">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v.id)}
            className="relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors"
          >
            {active === v.id && (
              <motion.span
                layoutId="runtime-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-violet/80 to-cyan/70"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className={active === v.id ? "relative text-white" : "relative text-muted"}>
              {v.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <CodeFrame html={current.html} code={current.code} filename={current.filename} lang="ts" />
          <p className="mt-3 text-sm text-muted leading-relaxed max-w-2xl">{current.note}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

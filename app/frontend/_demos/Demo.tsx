"use client"

import { useState, type ReactNode } from "react"
import { RegistryProvider } from "@effect/atom-react"

/**
 * The shell every live demo renders inside: window chrome matching CodeFrame, a
 * label, and a reset control.
 *
 * Each demo mounts its OWN `RegistryProvider` here rather than inheriting one
 * from the root layout. That is deliberate: a provider at the root would make
 * every page in the site client-rendered, where this way the lesson pages stay
 * static and only the widget hydrates.
 *
 * Reset works by remounting the subtree with a new `key`, which discards the
 * registry and rebuilds every atom from scratch — the honest way to get a clean
 * slate without teaching a reset API that doesn't exist.
 */
export function Demo({
  label = "live",
  children
}: {
  label?: string | undefined
  children: ReactNode
}) {
  const [generation, setGeneration] = useState(0)

  return (
    <div className="code-card not-prose">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
        <span className="flex gap-1.5">
          <span className="dot bg-[#ff5f57]" />
          <span className="dot bg-[#febc2e]" />
          <span className="dot bg-[#28c840]" />
        </span>
        <span className="text-xs font-mono text-muted truncate">{label}</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan/70">
            running
          </span>
          <button
            type="button"
            onClick={() => setGeneration((n) => n + 1)}
            className="text-[10px] font-mono uppercase tracking-widest text-muted/70 hover:text-foreground transition-colors"
          >
            reset
          </button>
        </span>
      </div>
      <div className="p-5">
        <RegistryProvider key={generation}>{children}</RegistryProvider>
      </div>
    </div>
  )
}

/** A small button, styled once so the five demos look like one system. */
export function DemoButton({
  onClick,
  children,
  disabled = false
}: {
  onClick: () => void
  children: ReactNode
  disabled?: boolean | undefined
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-border bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-cyan/40 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

/** The row of controls above a demo's output. */
export function DemoControls({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

/** The output panel below the controls. */
export function DemoOutput({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-md border border-border bg-black/20 p-4 font-mono text-sm">
      {children}
    </div>
  )
}

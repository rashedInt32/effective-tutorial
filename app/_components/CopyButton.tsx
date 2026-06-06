"use client"

import { useState } from "react"

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(code).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        })
      }}
      className="text-xs font-mono px-2.5 py-1 rounded-md border border-border text-muted hover:text-foreground hover:border-white/25 transition-colors"
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  )
}

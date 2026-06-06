import { CopyButton } from "./CopyButton"

/**
 * Presentational code card: window chrome + Shiki HTML. Shared by server pages
 * and the interactive client components (scroll-stack, runtime toggle).
 */
export function CodeFrame({
  html,
  code,
  filename,
  lang = "ts"
}: {
  html: string
  code: string
  filename?: string | undefined
  lang?: string | undefined
}) {
  return (
    <div className="code-card">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
        <span className="flex gap-1.5">
          <span className="dot bg-[#ff5f57]" />
          <span className="dot bg-[#febc2e]" />
          <span className="dot bg-[#28c840]" />
        </span>
        {filename && (
          <span className="text-xs font-mono text-muted truncate">{filename}</span>
        )}
        <span className="ml-auto flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted/70">
            {lang}
          </span>
          <CopyButton code={code} />
        </span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

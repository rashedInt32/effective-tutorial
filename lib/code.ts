import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createHighlighter, type Highlighter } from "shiki"

const THEME = "one-dark-pro"

let highlighterPromise: Promise<Highlighter> | undefined

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME],
      langs: ["ts", "bash"]
    })
  }
  return highlighterPromise
}

/** Highlight a code string to HTML using our dark theme. */
export async function highlight(code: string, lang: "ts" | "bash" = "ts") {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, { lang, theme: THEME })
}

/**
 * Read a source file under `examples/` and pull out the snippets marked with
 *   // #region <id>   ...   // #endregion <id>
 * Returns a map of id -> dedented code (marker lines removed). This keeps the
 * code shown in the tutorial identical to the code that actually typechecks.
 */
export function loadRegions(relativePath: string): Record<string, string> {
  const full = join(process.cwd(), "examples", relativePath)
  const lines = readFileSync(full, "utf8").split("\n")

  const out: Record<string, string> = {}
  const open: { id: string; buf: string[] }[] = []

  for (const line of lines) {
    const start = line.match(/^\s*\/\/\s*#region\s+(\S+)\s*$/)
    const end = line.match(/^\s*\/\/\s*#endregion\s+(\S+)\s*$/)
    if (start) {
      open.push({ id: start[1], buf: [] })
      continue
    }
    if (end) {
      const region = open.pop()
      if (region) out[region.id] = dedent(region.buf).join("\n").trim()
      continue
    }
    for (const region of open) region.buf.push(line)
  }

  return out
}

function dedent(lines: string[]): string[] {
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^\s*/)?.[0].length ?? 0)
  const min = indents.length ? Math.min(...indents) : 0
  return lines.map((l) => l.slice(min))
}

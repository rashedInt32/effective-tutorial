import { readFileSync } from "node:fs"
import { join, sep } from "node:path"
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

type Lang = "ts" | "bash"

/** A code snippet paired with its highlighted HTML — the props a CodeFrame needs. */
export type Snippet = { code: string; html: string }

/** Highlight a code string to HTML using our dark theme. */
export async function highlight(code: string, lang: Lang = "ts") {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, { lang, theme: THEME })
}

/**
 * Highlight a keyed set of snippets in parallel. Returns a map of the same keys
 * to `{ code, html }`, each spreadable straight into a <CodeFrame />. Use this
 * for inline (non-file) snippets where the shown code is the copied code.
 */
export async function highlightAll<K extends string>(
  inputs: Record<K, { code: string; lang?: Lang }>
): Promise<Record<K, Snippet>> {
  const entries = await Promise.all(
    (Object.entries(inputs) as [K, { code: string; lang?: Lang }][]).map(
      async ([key, { code, lang = "ts" }]) =>
        [key, { code, html: await highlight(code, lang) }] as const
    )
  )
  return Object.fromEntries(entries) as Record<K, Snippet>
}

/**
 * Load `examples/<relativePath>` and highlight the requested regions in
 * parallel, returning a `{ code, html }` map keyed by region id. Throws with a
 * clear message if any requested id is absent — so a renamed or deleted region
 * fails loudly at build time instead of crashing the highlighter on `undefined`.
 */
export async function highlightRegions<const Ids extends readonly string[]>(
  relativePath: string,
  ids: Ids
): Promise<Record<Ids[number], Snippet>> {
  const regions = loadRegions(relativePath)
  const missing = ids.filter((id) => !(id in regions))
  if (missing.length > 0) {
    throw new Error(
      `examples/${relativePath} is missing region(s): ${missing.join(", ")}.\n` +
        `Found: ${Object.keys(regions).join(", ") || "(none)"}`
    )
  }
  const inputs = Object.fromEntries(
    ids.map((id) => [id, { code: regions[id], lang: "ts" as const }])
  ) as Record<Ids[number], { code: string; lang: Lang }>
  return highlightAll(inputs)
}

/**
 * Read a source file under `examples/` and pull out the snippets marked with
 *   // #region <id>   ...   // #endregion <id>
 * Returns a map of id -> dedented code (marker lines removed). This keeps the
 * code shown in the tutorial identical to the code that actually typechecks.
 */
export function loadRegions(relativePath: string): Record<string, string> {
  // Callers pass build-time constants today; the guard keeps that safe by
  // construction if a dynamic route ever feeds this a request-derived path.
  const base = join(process.cwd(), "examples")
  const full = join(base, relativePath)
  if (!full.startsWith(base + sep)) {
    throw new Error(`lib/code: path escapes examples/: ${relativePath}`)
  }
  return parseRegions(readFileSync(full, "utf8"), `examples/${relativePath}`)
}

/**
 * Extract `#region` snippets from source text. Strict by design: duplicate,
 * mismatched, malformed, or unclosed markers all throw, so a typo'd marker
 * fails the build instead of silently rendering the wrong snippet.
 */
export function parseRegions(source: string, label: string): Record<string, string> {
  const out: Record<string, string> = {}
  const open: { id: string; buf: string[] }[] = []

  for (const line of source.split("\n")) {
    const start = line.match(/^\s*\/\/\s*#region\s+(\S+)\s*$/)
    if (start) {
      if (start[1] in out || open.some((r) => r.id === start[1])) {
        throw new Error(`${label}: duplicate region "${start[1]}"`)
      }
      open.push({ id: start[1], buf: [] })
      continue
    }
    const end = line.match(/^\s*\/\/\s*#endregion\s+(\S+)\s*$/)
    if (end) {
      const region = open.pop()
      if (!region) {
        throw new Error(`${label}: #endregion ${end[1]} closes nothing`)
      }
      if (region.id !== end[1]) {
        throw new Error(
          `${label}: #endregion ${end[1]} closes open region "${region.id}"`
        )
      }
      out[region.id] = dedent(region.buf).join("\n").trim()
      continue
    }
    // A marker-ish line that matched neither pattern (e.g. a bare
    // `// #endregion` with no id) would otherwise ship inside the snippet.
    if (/^\s*\/\/\s*#(region|endregion)\b/.test(line)) {
      throw new Error(`${label}: malformed region marker: ${line.trim()}`)
    }
    for (const region of open) region.buf.push(line)
  }

  if (open.length > 0) {
    throw new Error(
      `${label}: unclosed region(s): ${open.map((r) => r.id).join(", ")}`
    )
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

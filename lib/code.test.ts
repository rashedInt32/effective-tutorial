import { describe, expect, it } from "vitest"
import { loadRegions, parseImports, parseRegions, withImports } from "./code"

const lines = (...ls: string[]) => ls.join("\n")

describe("parseRegions", () => {
  it("extracts a region, dropping the marker lines", () => {
    const src = lines(
      "// #region greet",
      'const msg = "hi"',
      "// #endregion greet"
    )
    expect(parseRegions(src, "test.ts")).toEqual({ greet: 'const msg = "hi"' })
  })

  it("dedents to the shallowest non-empty line", () => {
    const src = lines(
      "// #region body",
      "    if (x) {",
      "      run()",
      "    }",
      "// #endregion body"
    )
    expect(parseRegions(src, "test.ts")).toEqual({
      body: lines("if (x) {", "  run()", "}")
    })
  })

  it("supports nested regions, assigning shared lines to both", () => {
    const src = lines(
      "// #region outer",
      "before",
      "// #region inner",
      "shared",
      "// #endregion inner",
      "after",
      "// #endregion outer"
    )
    expect(parseRegions(src, "test.ts")).toEqual({
      inner: "shared",
      outer: lines("before", "shared", "after")
    })
  })

  it("throws on a duplicate region id", () => {
    const src = lines(
      "// #region a",
      "// #endregion a",
      "// #region a",
      "// #endregion a"
    )
    expect(() => parseRegions(src, "test.ts")).toThrow(/duplicate region "a"/)
  })

  it("throws when an #endregion id does not match the open region", () => {
    const src = lines(
      "// #region outer",
      "// #region inner",
      "// #endregion outer",
      "// #endregion inner"
    )
    expect(() => parseRegions(src, "test.ts")).toThrow(
      /#endregion outer closes open region "inner"/
    )
  })

  it("throws on an #endregion with no open region", () => {
    expect(() => parseRegions("// #endregion ghost", "test.ts")).toThrow(
      /closes nothing/
    )
  })

  it("throws on a bare #endregion without an id", () => {
    const src = lines("// #region a", "code", "// #endregion")
    expect(() => parseRegions(src, "test.ts")).toThrow(/malformed region marker/)
  })

  it("throws on regions left unclosed at end of file", () => {
    const src = lines("// #region a", "code")
    expect(() => parseRegions(src, "test.ts")).toThrow(/unclosed region\(s\): a/)
  })
})

describe("parseImports", () => {
  it("parses named, aliased, type, default and namespace imports", () => {
    const src = lines(
      'import { Effect, Layer as L, type Scope } from "effect"',
      "import {",
      "  HttpRouter,",
      "  HttpServerResponse",
      '} from "effect/unstable/http"',
      'import type { Metadata } from "next"',
      'import Link from "next/link"',
      'import * as Fs from "node:fs"',
      "const x = 1"
    )
    expect(parseImports(src)).toEqual([
      {
        module: '"effect"',
        typeOnly: false,
        named: [
          { text: "Effect", local: "Effect" },
          { text: "Layer as L", local: "L" },
          { text: "type Scope", local: "Scope" }
        ]
      },
      {
        module: '"effect/unstable/http"',
        typeOnly: false,
        named: [
          { text: "HttpRouter", local: "HttpRouter" },
          { text: "HttpServerResponse", local: "HttpServerResponse" }
        ]
      },
      { module: '"next"', typeOnly: true, named: [{ text: "Metadata", local: "Metadata" }] },
      { module: '"next/link"', typeOnly: false, defaultName: "Link", named: [] },
      { module: '"node:fs"', typeOnly: false, namespace: "Fs", named: [] }
    ])
  })
})

describe("withImports", () => {
  const src = lines(
    'import { Effect, Layer, Schema } from "effect"',
    'import { HttpRouter } from "effect/unstable/http"',
    'import * as Fs from "node:fs"',
    "// #region a",
    "const a = Effect.succeed(1)",
    "// #endregion a",
    "// #region b",
    "const b = Layer.succeed(Fs.readFileSync)",
    "// #endregion b",
    "// #region c",
    "const c = 3",
    "// #endregion c"
  )

  it("prepends only the imports each region references", () => {
    const out = withImports(src, parseRegions(src, "t.ts"))
    expect(out.a).toBe(lines('import { Effect } from "effect"', "", "const a = Effect.succeed(1)"))
    expect(out.b).toBe(
      lines(
        'import { Layer } from "effect"',
        'import * as Fs from "node:fs"',
        "",
        "const b = Layer.succeed(Fs.readFileSync)"
      )
    )
  })

  it("leaves a region untouched when it uses no imports", () => {
    expect(withImports(src, parseRegions(src, "t.ts")).c).toBe("const c = 3")
  })

  it("matches whole identifiers only", () => {
    const s = lines('import { Ref } from "effect"', "// #region r", "const Refs = 1", "// #endregion r")
    expect(withImports(s, parseRegions(s, "t.ts")).r).toBe("const Refs = 1")
  })

  it("keeps aliases and type modifiers as written", () => {
    const s = lines(
      'import { Layer as L, type Scope } from "effect"',
      'import type { Metadata } from "next"',
      "// #region r",
      "declare const s: Scope",
      "declare const m: Metadata",
      "// #endregion r"
    )
    expect(withImports(s, parseRegions(s, "t.ts")).r).toBe(
      lines(
        'import { type Scope } from "effect"',
        'import type { Metadata } from "next"',
        "",
        "declare const s: Scope",
        "declare const m: Metadata"
      )
    )
  })
})

describe("loadRegions", () => {
  it("rejects paths that escape examples/", () => {
    expect(() => loadRegions("../package.json")).toThrow(/escapes examples\//)
  })

  it("reads a real example file and prefixes regions with their imports", () => {
    const regions = loadRegions("backend/01-create-and-run-server.ts")
    expect(Object.keys(regions).length).toBeGreaterThan(0)
    for (const code of Object.values(regions)) {
      if (/\bEffect\./.test(code)) expect(code).toMatch(/^import \{[^}]*\bEffect\b[^}]*\} from "effect"/m)
    }
  })
})

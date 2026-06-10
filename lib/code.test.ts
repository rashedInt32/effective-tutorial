import { describe, expect, it } from "vitest"
import { loadRegions, parseRegions } from "./code"

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

describe("loadRegions", () => {
  it("rejects paths that escape examples/", () => {
    expect(() => loadRegions("../package.json")).toThrow(/escapes examples\//)
  })

  it("reads a real example file", () => {
    const regions = loadRegions("backend/01-create-and-run-server.ts")
    expect(Object.keys(regions).length).toBeGreaterThan(0)
  })
})

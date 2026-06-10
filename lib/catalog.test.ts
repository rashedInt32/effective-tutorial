import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { fieldGuides, lessons, nextLesson, wholeMaps } from "./catalog"

/* The catalog and the route directories are kept in sync by hand — these tests
   make a renamed folder or stale catalog entry fail in CI instead of 404ing
   at click time. */

const root = process.cwd()

const routeDirs = (segment: string) =>
  readdirSync(join(root, "app", segment), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

describe("catalog ↔ routes", () => {
  it("every backend entry (lessons + whole maps) has a page", () => {
    for (const entry of [...lessons, ...wholeMaps]) {
      expect(
        existsSync(join(root, "app", "backend", entry.slug, "page.tsx")),
        `app/backend/${entry.slug}/page.tsx missing for catalog entry "${entry.title}"`
      ).toBe(true)
    }
  })

  it("every field guide has a page", () => {
    for (const entry of fieldGuides) {
      expect(
        existsSync(join(root, "app", "reference", entry.slug, "page.tsx")),
        `app/reference/${entry.slug}/page.tsx missing for catalog entry "${entry.title}"`
      ).toBe(true)
    }
  })

  it("every backend route directory is in the catalog", () => {
    const slugs = new Set<string>([...lessons, ...wholeMaps].map((e) => e.slug))
    for (const dir of routeDirs("backend")) {
      expect(slugs.has(dir), `app/backend/${dir} has no catalog entry`).toBe(true)
    }
  })

  it("every reference route directory is in the catalog", () => {
    const slugs = new Set<string>(fieldGuides.map((e) => e.slug))
    for (const dir of routeDirs("reference")) {
      expect(slugs.has(dir), `app/reference/${dir} has no catalog entry`).toBe(true)
    }
  })

  it("hrefs are derived from slugs", () => {
    for (const e of [...lessons, ...wholeMaps]) expect(e.href).toBe(`/backend/${e.slug}`)
    for (const e of fieldGuides) expect(e.href).toBe(`/reference/${e.slug}`)
  })

  it("the next-lesson chain walks the lessons in order and terminates", () => {
    expect(nextLesson(lessons[0].slug)?.slug).toBe(lessons[1].slug)
    expect(nextLesson(lessons[lessons.length - 1].slug)).toBeUndefined()
    expect(nextLesson("http-reference")).toBeUndefined()
  })
})

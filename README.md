# Effect, on point — a learn-by-doing tutorial

A tutorial site that teaches [Effect](https://effect.website) v4 by answering one
real question at a time, with code you can run. Built with Next.js (App Router),
Tailwind v4, Shiki, and Motion.

## Commands

```bash
pnpm dev        # start the dev server  → http://localhost:3000
pnpm build      # production build (also typechecks + highlights every snippet)
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint
```

`pnpm build` is the real gate: every lesson page highlights its snippets at build
time, so a broken example or a renamed region fails the build (see below).

## How it's organized

```
app/
  page.tsx                     Home — the lesson index
  backend/<lesson>/page.tsx    One lesson page (a React Server Component)
  _components/                 Presentational + interactive UI (CodeFrame, ScrollStack, …)
  globals.css                  The dark "devtools + glow" design system
examples/
  backend/<lesson>.ts          The real, typechecked source the snippets are lifted from
lib/
  code.ts                      Snippet loading + Shiki highlighting
```

### The core invariant: shown code === code that typechecks

The code displayed in a lesson is **not** pasted into the page. It lives in a real
`.ts` file under `examples/`, marked into named regions:

```ts
// #region handler-gen
export const helloGen = Effect.gen(function* () {
  return HttpServerResponse.text("Hello from Effect!")
})
// #endregion handler-gen
```

A page pulls those regions in and highlights them:

```ts
const snip = await highlightRegions("backend/01-create-and-run-server.ts", [
  "handler-gen",
  "route"
])
// snip["handler-gen"] = { code, html } — spread straight into a <CodeFrame />
<CodeFrame {...snip["handler-gen"]} filename="handler.ts" />
```

Because the examples are part of the project's `tsconfig`, `pnpm typecheck` keeps
every shown snippet honest. If you rename or delete a region, `highlightRegions`
throws a clear build error naming the missing id — never a cryptic highlighter
crash.

For inline snippets that aren't backed by a file (terminal commands, hand-curated
reference menus), use `highlight` (one snippet) or `highlightAll` (a keyed set).
The reference menus on the HttpApi page are intentionally hand-curated, not lifted
from source — the page's prose says so.

## Adding a lesson

1. Write a runnable, typechecking `examples/backend/<nn>-<slug>.ts`, marking the
   snippets to show with `// #region <id>` / `// #endregion <id>`.
2. Create `app/backend/<nn>-<slug>/page.tsx`, load the regions with
   `highlightRegions`, and lay out prose with the primitives in
   `app/_components/Prose.tsx` (`Section`, `Callout`, `ModuleNote`, `Quote`, `Code`).
3. Add the lesson to the index array in `app/page.tsx`.
4. Run `pnpm build` — it typechecks the example and proves every region renders.

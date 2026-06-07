<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- effect-solutions:start -->
## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `~/.local/share/effect-solutions/effect` for real implementations

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.

## Local Effect Source

The Effect source repository is cloned to `~/.local/share/effect-solutions/effect` for reference. Use this to explore APIs, find usage examples, and understand implementation details when the documentation isn't enough.
<!-- effect-solutions:end -->

## Vendored Effect source — the source of truth (pinned to the installed beta)

The Effect v4 source is vendored as a **git submodule** at `repos/effect`, pinned to the **exact installed version** — `effect@4.0.0-beta.78`, from [`Effect-TS/effect-smol`](https://github.com/Effect-TS/effect-smol) (the repo where v4 beta lives; the public `Effect-TS/effect` is still v3).

Prefer this over the `~/.local/share/effect-solutions/effect` clone above: that clone tracks HEAD and has **drifted ahead** of the installed beta (renamed/removed APIs — e.g. `Either`→`Result`, no `Effect.fork`, no `Data.struct`). The submodule matches `node_modules` exactly.

- Core package source: `repos/effect/packages/effect/src/` (e.g. `Effect.ts`, `Schema.ts`, `Stream.ts`, `unstable/http/`, `unstable/httpapi/`). Grep here for real signatures, JSDoc, and implementations.
- **Read-only reference** — never edit it, never import from it. It is excluded from typecheck, lint, Next's build, and editor search.
- After cloning this repo, run `git submodule update --init repos/effect` to populate it.
- To bump when the installed beta changes: `cd repos/effect && git fetch --tags && git checkout effect@4.0.0-beta.<N> && cd ../.. && git add repos/effect && git commit`.

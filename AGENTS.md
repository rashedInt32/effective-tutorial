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

The Effect v4 source is vendored as a **git submodule** at `repos/effect`, pinned to the **exact installed version** — `effect@4.0.0-rc.112`, from [`Effect-TS/effect`](https://github.com/Effect-TS/effect) (v4 moved from `effect-smol` into the main repo at the rc line; `effect-smol` tags stop at beta.98).

Prefer this over the `~/.local/share/effect-solutions/effect` clone above: that clone tracks HEAD and may **drift** from the installed release (renamed/removed APIs — e.g. `Schema.TaggedErrorClass`→`Schema.TaggedError`, `Schedule.both`→`Schedule.max`, no `Effect.fork`). The submodule matches `node_modules` exactly.

- Core package source: `repos/effect/packages/effect/src/` (e.g. `Effect.ts`, `Schema.ts`, `Stream.ts`, `unstable/http/`, `unstable/httpapi/`). Grep here for real signatures, JSDoc, and implementations.
- **Read-only reference** — never edit it, never import from it. It is excluded from typecheck, lint, Next's build, and editor search.
- After cloning this repo, run `git submodule update --init repos/effect` to populate it.
- To bump when the installed release changes: `cd repos/effect && git fetch --depth 1 origin tag effect@4.0.0-rc.<N> && git checkout effect@4.0.0-rc.<N> && cd ../.. && git add repos/effect && git commit`.
- Bumping `effect` itself: `pnpm add effect@<v> @effect/platform-node@<v> @effect/platform-bun@<v>`, then `pnpm typecheck` to surface removed/renamed APIs in `examples/`. Keep `typescript` on 6.x (the `@effect/language-service` `prepare` patch rejects 7.x) and `eslint` on 9.x (eslint-plugin-react, via eslint-config-next, breaks on 10).

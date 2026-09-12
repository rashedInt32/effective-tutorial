"use client"

import { Suspense } from "react"
import { Effect } from "effect"
import { Atom, AsyncResult } from "effect/unstable/reactivity"
import { RegistryProvider, useAtomSuspense } from "@effect/atom-react"
import { Demo, DemoOutput } from "./Demo"

export type TodoRow = { readonly id: number; readonly title: string; readonly done: boolean }

/* A deliberately slow fetch, so the difference between a seeded and an unseeded
   registry is impossible to miss. */
const fetchTodos: Effect.Effect<ReadonlyArray<TodoRow>> = Effect.delay(
  Effect.succeed([
    { id: 1, title: "Read the backend half", done: true },
    { id: 2, title: "Try atoms", done: false }
  ]),
  "1200 millis"
)

const todosAtom = Atom.make(fetchTodos)

/** Reads with suspense, so there is no loading branch in this component. */
function Todos() {
  const { value } = useAtomSuspense(todosAtom)
  return (
    <DemoOutput>
      <div className="flex flex-col gap-1">
        {value.map((t) => (
          <span key={t.id} className="text-cyan">
            <span className="text-muted">#{t.id}</span> {t.title}
          </span>
        ))}
      </div>
    </DemoOutput>
  )
}

function Skeleton() {
  return (
    <DemoOutput>
      <span className="text-[#febc2e]">loading… (suspended)</span>
    </DemoOutput>
  )
}

/**
 * Two registries side by side. The right-hand one is seeded with the value the
 * server already had, so its first render is the finished list — no request and
 * no fallback. The left-hand one starts empty and has to go and fetch.
 */
export function HydrationDemo({ serverTodos }: { serverTodos: ReadonlyArray<TodoRow> }) {
  return (
    <Demo label="page.tsx + TodoList.tsx">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-mono text-muted">
            no initialValues — fetches on the client
          </p>
          <RegistryProvider>
            <Suspense fallback={<Skeleton />}>
              <Todos />
            </Suspense>
          </RegistryProvider>
        </div>

        <div>
          <p className="mb-2 text-xs font-mono text-cyan/80">
            seeded from the server — instant
          </p>
          <RegistryProvider
            initialValues={[[todosAtom, AsyncResult.success(serverTodos)]]}
          >
            <Suspense fallback={<Skeleton />}>
              <Todos />
            </Suspense>
          </RegistryProvider>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">
        Same atom, same component, two registries. Press reset: the left one
        falls back to its skeleton while it loads, the right one renders the
        finished list immediately.
      </p>
    </Demo>
  )
}

"use client"

import { Data, Effect } from "effect"
import { Atom, AsyncResult } from "effect/unstable/reactivity"
import { useAtomRefresh, useAtomValue } from "@effect/atom-react"
import { Demo, DemoButton, DemoControls, DemoOutput } from "./Demo"

class Offline extends Data.TaggedError("Offline")<{ attempt: number }> {}

/* A fake network: slow enough to see `waiting`, and every third call fails. */
let attempt = 0
const fetchUsers = Effect.gen(function* () {
  yield* Effect.sleep("700 millis")
  attempt += 1
  if (attempt % 3 === 0) return yield* new Offline({ attempt })
  return [
    `Ada Lovelace (#${attempt})`,
    `Grace Hopper (#${attempt})`,
    `Barbara Liskov (#${attempt})`
  ]
})

const usersAtom = Atom.make(fetchUsers)

function Users() {
  const result = useAtomValue(usersAtom)
  const refresh = useAtomRefresh(usersAtom)

  const stale = result.waiting && AsyncResult.isSuccess(result)
  const rows = AsyncResult.getOrElse(result, () => [] as Array<string>)

  return (
    <>
      <DemoControls>
        <DemoButton onClick={refresh} disabled={result.waiting}>
          {result.waiting ? "loading…" : "refresh"}
        </DemoButton>
        <span className="ml-1 flex items-center gap-2 text-xs font-mono">
          <span
            className={
              result.waiting
                ? "inline-block h-2 w-2 rounded-full bg-[#febc2e] animate-pulse"
                : "inline-block h-2 w-2 rounded-full bg-[#28c840]"
            }
          />
          <span className="text-muted">
            {result._tag.toLowerCase()}
            {result.waiting ? " · waiting" : ""}
          </span>
        </span>
      </DemoControls>

      <DemoOutput>
        {AsyncResult.match(result, {
          onInitial: () => <span className="text-muted">nothing yet — loading…</span>,
          onFailure: () => (
            <div className="flex flex-col gap-2">
              <span className="text-[#ff5f57]">Offline — the third call always fails</span>
              {rows.length > 0 && (
                <span className="text-muted text-xs">
                  Showing the last successful data below, from the failed result:
                </span>
              )}
              {rows.map((r) => (
                <span key={r} className="text-muted/60">
                  {r}
                </span>
              ))}
            </div>
          ),
          onSuccess: () => (
            <div className="flex flex-col gap-1">
              {rows.map((r) => (
                <span key={r} className={stale ? "text-muted/50" : "text-cyan"}>
                  {r}
                  {stale && <span className="ml-2 text-xs">(stale)</span>}
                </span>
              ))}
            </div>
          )
        })}
      </DemoOutput>
    </>
  )
}

export function AsyncDemo() {
  return (
    <Demo label="users.tsx">
      <Users />
    </Demo>
  )
}

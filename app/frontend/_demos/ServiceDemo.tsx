"use client"

import { useState } from "react"
import { Context, Data, Effect, Layer } from "effect"
import { Atom, AsyncResult } from "effect/unstable/reactivity"
import { useAtomRefresh, useAtomValue } from "@effect/atom-react"
import { Demo, DemoButton, DemoControls, DemoOutput } from "./Demo"

class LoadError extends Data.TaggedError("LoadError")<{ reason: string }> {}

class UserApi extends Context.Service<UserApi, {
  readonly list: Effect.Effect<ReadonlyArray<string>, LoadError>
}>()("app/UserApi") {}

const UserApiLive = Layer.succeed(UserApi, {
  list: Effect.delay(Effect.succeed(["Ada Lovelace", "Grace Hopper"]), "400 millis")
})

const UserApiBroken = Layer.succeed(UserApi, {
  list: Effect.delay(Effect.fail(new LoadError({ reason: "503 from upstream" })), "400 millis")
})

/* Two runtimes over the same interface. The atom body below is identical for
   both — only the layer differs, which is the whole point of the lesson. */
const listUsers = Effect.flatMap(UserApi, (api) => api.list)

const liveRuntime = Atom.runtime(UserApiLive)
const brokenRuntime = Atom.runtime(UserApiBroken)

const liveUsersAtom = liveRuntime.atom(listUsers)
const brokenUsersAtom = brokenRuntime.atom(listUsers)

function Users({ broken }: { broken: boolean }) {
  const atom = broken ? brokenUsersAtom : liveUsersAtom
  const result = useAtomValue(atom)
  const refresh = useAtomRefresh(atom)

  return (
    <>
      <DemoControls>
        <DemoButton onClick={refresh} disabled={result.waiting}>
          {result.waiting ? "loading…" : "reload"}
        </DemoButton>
        <span className="ml-1 text-xs font-mono text-muted">
          layer: {broken ? "UserApiBroken" : "UserApiLive"}
        </span>
      </DemoControls>
      <DemoOutput>
        {AsyncResult.match(result, {
          onInitial: () => <span className="text-muted">nothing yet…</span>,
          onFailure: (failure) => (
            <span className="text-[#ff5f57]">
              LoadError ·{" "}
              {AsyncResult.isFailure(failure) ? "503 from upstream" : "failed"}
            </span>
          ),
          onSuccess: (success) => (
            <div className="flex flex-col gap-1">
              {success.value.map((u) => (
                <span key={u} className="text-cyan">
                  {u}
                </span>
              ))}
            </div>
          )
        })}
      </DemoOutput>
    </>
  )
}

export function ServiceDemo() {
  const [broken, setBroken] = useState(false)

  return (
    <Demo label="users.tsx">
      <div className="mb-4 flex items-center gap-2">
        <DemoButton onClick={() => setBroken(false)} disabled={!broken}>
          provide UserApiLive
        </DemoButton>
        <DemoButton onClick={() => setBroken(true)} disabled={broken}>
          provide UserApiBroken
        </DemoButton>
      </div>
      <Users broken={broken} />
      <p className="mt-3 text-xs text-muted">
        The atom body is the same either way — only the Layer changed.
      </p>
    </Demo>
  )
}

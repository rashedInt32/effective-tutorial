"use client"

import { Atom } from "effect/unstable/reactivity"
import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react"
import { Demo, DemoButton, DemoControls, DemoOutput } from "./Demo"

/* The atoms from examples/frontend/10-state-in-the-browser.ts, live. */
const countAtom = Atom.make(0)
const doubledAtom = Atom.make((get) => get(countAtom) * 2)

/** Owns the buttons. Uses `useAtomSet`, so writing doesn't subscribe it. */
function Controls() {
  const setCount = useAtomSet(countAtom)
  return (
    <DemoControls>
      <DemoButton onClick={() => setCount((n) => n + 1)}>increment</DemoButton>
      <DemoButton onClick={() => setCount((n) => n - 1)}>decrement</DemoButton>
      <DemoButton onClick={() => setCount(0)}>zero</DemoButton>
    </DemoControls>
  )
}

/** A separate component, nowhere near Controls in the tree, reading the same atom. */
function Readout() {
  const count = useAtomValue(countAtom)
  const doubled = useAtomValue(doubledAtom)
  return (
    <DemoOutput>
      <div className="flex flex-col gap-1">
        <span>
          <span className="text-muted">count</span>{" "}
          <span className="text-cyan">{count}</span>
        </span>
        <span>
          <span className="text-muted">doubled (derived)</span>{" "}
          <span className="text-violet">{doubled}</span>
        </span>
      </div>
    </DemoOutput>
  )
}

/** A third subscriber, to make the point that no props were passed anywhere. */
function Elsewhere() {
  const [count] = useAtom(countAtom)
  return (
    <p className="mt-3 text-xs text-muted">
      A third component, no props: {count === 0 ? "nothing yet" : `saw ${count}`}
    </p>
  )
}

export function CounterDemo() {
  return (
    <Demo label="counter.tsx">
      <Controls />
      <Readout />
      <Elsewhere />
    </Demo>
  )
}

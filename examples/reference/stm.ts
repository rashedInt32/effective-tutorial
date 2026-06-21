import { Effect, TxHashMap, TxRef } from "effect"

// Coordinating shared state with locks is where concurrency bugs live. Software
// Transactional Memory replaces locks with TRANSACTIONS: read and write
// transactional values inside `Effect.tx`, and the whole block commits
// atomically — all-or-nothing, no torn reads, and it retries itself on a
// conflict. Every region typechecks against effect@4 beta.

// #region txref
// A `TxRef` is a Ref that participates in transactions. Its `get`/`set`/`update`
// are Effects; run them inside `Effect.tx` and they commit together. A single op
// is already atomic — the transaction matters when you touch SEVERAL values.
export const counter = Effect.gen(function* () {
  const ref = yield* TxRef.make(0)
  yield* Effect.tx(TxRef.update(ref, (n) => n + 1))
  return yield* TxRef.get(ref)
})
// #endregion txref

// #region transfer
// The canonical example: move money between two accounts. Inside one `tx`, the
// debit and credit either BOTH happen or NEITHER does — no observer ever sees one
// without the other, and no lock is held. If another fiber commits a conflicting
// change mid-flight, this block simply re-runs on the fresh state.
export const transfer = Effect.gen(function* () {
  const checking = yield* TxRef.make(100)
  const savings = yield* TxRef.make(0)

  yield* Effect.tx(
    Effect.gen(function* () {
      const balance = yield* TxRef.get(checking)
      if (balance < 30) return yield* Effect.fail("insufficient funds" as const)
      yield* TxRef.set(checking, balance - 30)
      yield* TxRef.update(savings, (amount) => amount + 30)
    })
  )

  return [yield* TxRef.get(checking), yield* TxRef.get(savings)] as const // [70, 30]
})
// #endregion transfer

// #region txmap
// The transactional sibling of `HashMap`. A multi-step edit — add one entry,
// remove another — wrapped in `Effect.tx` is seen by readers as a single atomic
// change: never the half-applied state in between.
export const sessions = Effect.gen(function* () {
  const map = yield* TxHashMap.make(["u1", "Ada"])
  yield* Effect.tx(
    Effect.gen(function* () {
      yield* TxHashMap.set(map, "u2", "Linus")
      yield* TxHashMap.remove(map, "u1")
    })
  )
  return yield* TxHashMap.size(map) // 1
})
// #endregion txmap

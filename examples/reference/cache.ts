import { Cache, Effect, Exit, Request, RequestResolver } from "effect"

// Two ways to stop doing the same work twice. A `Cache` REMEMBERS results across
// calls, keyed by input. Request batching COLLAPSES many lookups happening at
// once into a single round-trip — the cure for the N+1 query. Both keep your
// code written as one-call-at-a-time. Every region typechecks against effect@4
// beta.

// #region cache
// `Cache.make` wraps a `lookup` (any `key -> Effect`) with memoization: a hit
// returns the stored value, a miss runs the lookup once and stores it, and
// concurrent misses for the SAME key share one in-flight lookup. `capacity`
// bounds entries (LRU), `timeToLive` expires them. `make` is itself an Effect.
export const userCache = Effect.gen(function* () {
  const cache = yield* Cache.make({
    capacity: 1000,
    timeToLive: "5 minutes",
    lookup: (id: number) => fetchUser(id) // the expensive call, run at most once per id
  })

  const a = yield* Cache.get(cache, 1) // miss -> runs fetchUser(1)
  const b = yield* Cache.get(cache, 1) // hit  -> no fetch, returns the stored value
  return [a, b] as const
})

const fetchUser = (id: number) => Effect.succeed({ id, name: `User ${id}` })
// #endregion cache

// #region refresh
// Stale beats slow — but only briefly. `refresh` recomputes a key WITHOUT
// evicting it, so readers keep getting the old value until the new one lands.
// `invalidate` drops an entry so the next read recomputes. Both are Effects.
export const keepFresh = (cache: Cache.Cache<number, { id: number; name: string }>) =>
  Effect.gen(function* () {
    yield* Cache.refresh(cache, 1) // recompute 1 in the background; no gap for readers
    yield* Cache.invalidate(cache, 2) // force the next get(2) to miss
  })
// #endregion refresh

// #region batch
// Caching skips REPEATED work; batching fuses CONCURRENT work. Model the lookup
// as a `Request`, write a `RequestResolver` that handles a whole BATCH of them
// at once, and Effect gathers every request issued together into one call to the
// resolver — 100 `getUser`s become a single `WHERE id IN (...)`.
interface GetUser extends Request.Request<{ id: number; name: string }> {
  readonly _tag: "GetUser"
  readonly id: number
}
const GetUser = Request.tagged<GetUser>("GetUser")

export const UserResolver = RequestResolver.make<GetUser>(
  Effect.fnUntraced(function* (entries) {
    // `entries` is the whole batch — do ONE round-trip here, then complete each.
    for (const entry of entries) {
      yield* Request.complete(entry, Exit.succeed({ id: entry.request.id, name: `User ${entry.request.id}` }))
    }
  })
)

// Run concurrently, the requests issued in the same window are gathered and the
// resolver is invoked ONCE with all of them — one round-trip, not five.
export const loadMany = Effect.forEach(
  [1, 2, 3, 4, 5],
  (id) => Effect.request(GetUser({ id }), UserResolver),
  { concurrency: "unbounded" }
)
// #endregion batch

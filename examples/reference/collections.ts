import { Chunk, HashMap, HashSet, Option } from "effect"

// Effect ships persistent, immutable collections: every operation returns a NEW
// value and shares structure with the old one, so they're safe to hold across
// fibers and cheap to copy. `Chunk` is an array, `HashMap` a dictionary, `HashSet`
// a set — keyed by value equality. Every region typechecks against effect@4 beta.

// #region chunk
// `Chunk` is an immutable, array-like sequence with fast append and concat. Build
// it, transform it with the usual combinators, and drop back to a plain array at
// the edge. Nothing mutates — `append` returns a new chunk.
export const nums = Chunk.make(1, 2, 3)
export const doubled = Chunk.map(Chunk.append(nums, 4), (n) => n * 2) // Chunk<number>
export const asArray = Chunk.toReadonlyArray(doubled) // readonly [2, 4, 6, 8]
// #endregion chunk

// #region hashmap
// `HashMap` is a dictionary keyed by VALUE equality (not reference), so structural
// keys work. `get` returns an `Option` — a missing key is data, never `undefined`
// — and `set` returns a new map, leaving the original untouched.
export const prices = HashMap.make(["apple", 3], ["pear", 2])
export const withBanana = HashMap.set(prices, "banana", 1) // new map; `prices` unchanged
export const applePrice = HashMap.get(prices, "apple") // Option<number>
export const orZero = Option.getOrElse(HashMap.get(prices, "kiwi"), () => 0) // 0
// #endregion hashmap

// #region hashset
// `HashSet` holds unique values by the same equality — duplicates collapse on the
// way in. `add`/`union` return new sets; membership is `has`. Great for dedup and
// set algebra without a single mutation.
export const fruit = HashSet.make("apple", "pear", "apple") // size 2 — deduped
export const more = HashSet.add(fruit, "kiwi") // new set, size 3
export const merged = HashSet.union(fruit, HashSet.make("pear", "plum")) // {apple,pear,plum}
export const total = HashSet.size(merged) // 3
// #endregion hashset

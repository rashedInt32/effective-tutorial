import { Data, Equal, Match } from "effect"

// Effect models data as immutable VALUES: two structurally-identical values count
// as equal, and a closed set of cases becomes a tagged union you match
// exhaustively — the compiler keeping every case honest.

// #region equality
// A `Data.Class` compares by STRUCTURE, not reference — unlike a plain object,
// where `===` only ever asks "is it the same allocation?".
class Point extends Data.Class<{ readonly x: number; readonly y: number }> {}

const a = new Point({ x: 1, y: 2 })
const b = new Point({ x: 1, y: 2 })

export const structural = Equal.equals(a, b) // true  — same contents
export const reference = a === b //            false — different objects
// #endregion equality

// #region variants
// A tagged union: each case has its own `_tag` and fields. `Data.taggedEnum`
// derives a constructor for every case straight from the type.
type Shape = Data.TaggedEnum<{
  Circle: { readonly radius: number }
  Rect: { readonly width: number; readonly height: number }
}>
const Shape = Data.taggedEnum<Shape>()

export const circle = Shape.Circle({ radius: 2 }) //          Shape
export const rect = Shape.Rect({ width: 3, height: 4 }) //    Shape
// #endregion variants

// #region match
// Match by tag. `Match.exhaustive` makes the compiler reject any unhandled case —
// add a new variant later and this turns into a type error until you handle it.
export const area = (shape: Shape): number =>
  Match.value(shape).pipe(
    Match.tag("Circle", ({ radius }) => Math.PI * radius ** 2),
    Match.tag("Rect", ({ width, height }) => width * height),
    Match.exhaustive
  )
// #endregion match

import { Schema, SchemaGetter } from "effect"

// Lesson 03 used Schema at the HTTP boundary. This is the whole map: a `Schema`
// is one value that is at once a TS type, a decoder (`unknown` → typed), an
// encoder (typed → wire), and a constructor. Build them from primitives, add
// runtime checks, transform between shapes, brand them, and unite them. Every
// region typechecks against effect@4 beta.

// #region struct
// Compose primitives into a `Struct`. `optionalKey` makes a field optional;
// `Array` nests. The schema is also the source of the static type — read it back
// with `Schema.Schema.Type`, so the type and the validator can never drift.
export const Person = Schema.Struct({
  name: Schema.NonEmptyString,
  age: Schema.Number,
  nickname: Schema.optionalKey(Schema.String),
  tags: Schema.Array(Schema.String)
})

export type Person = typeof Person.Type
// { readonly name: string; readonly age: number; readonly nickname?: string; readonly tags: readonly string[] }
// #endregion struct

// #region decode
// One schema, two directions, two error styles. `decodeUnknownSync` throws a
// `SchemaError` on bad input (handy at a trusted edge); `decodeUnknownEffect`
// returns the failure AS DATA in the Effect's error channel; `encodeUnknownSync`
// runs it backwards, typed value → the plain wire shape.
export const parsePerson = Schema.decodeUnknownSync(Person) // (u: unknown) => Person  (throws)
export const decodePerson = Schema.decodeUnknownEffect(Person) // (u) => Effect<Person, SchemaError>
export const encodePerson = Schema.encodeUnknownSync(Person) // (Person) => the encoded shape
// #endregion decode

// #region check
// A `.check(...)` attaches a runtime CONSTRAINT to a schema without changing its
// type — the value still has to pass to decode. Constructors are `Schema.is*`:
// compose several and all must hold. Meaning lives in the schema, not in scattered
// `if` guards downstream.
export const Age = Schema.Number.check(Schema.isBetween({ minimum: 0, maximum: 150 }))
export const Username = Schema.String.check(Schema.isMinLength(3), Schema.isMaxLength(20))
// #endregion check

// #region transform
// Encoded and decoded can be DIFFERENT shapes. Most conversions already exist —
// `Schema.FiniteFromString` is the built-in string <-> number codec, and it
// REJECTS "abc" instead of decoding it to NaN.
export const Amount = Schema.FiniteFromString
// Schema.decodeUnknownSync(Amount)("42") -> 42 (a number); "abc" fails

// Rolling your own: `decodeTo` bridges the two sides with a pair of getters —
// `decode` maps the source in, `encode` reverses it out. Prefer the built-in
// `SchemaGetter` conversions over a hand-written `Number(...)`, which would let
// NaN through.
export const NumberFromString = Schema.String.pipe(
  Schema.decodeTo(Schema.Number, {
    decode: SchemaGetter.Number(),
    encode: SchemaGetter.String()
  })
)
// #endregion transform

// #region brand
// Two `string`s with the same shape can still mean different things. `brand`
// makes a nominal type: a `UserId` is no longer assignable from a plain string,
// so you can't pass an order id where a user id is wanted. `.make` builds one.
export const UserId = Schema.String.pipe(Schema.brand("UserId"))
export type UserId = typeof UserId.Type
export const someId = UserId.make("u_42") // string & Brand<"UserId">
// #endregion brand

// #region class
// `Schema.Class` is one declaration that yields a constructor, a TS type, and an
// encoder/decoder at once. `TaggedError` does the same for a failure — a
// `_tag` for matching, plus the data its handler needs.
export class Point extends Schema.Class<Point>("Point")({
  x: Schema.Number,
  y: Schema.Number
}) {}

export class NotFound extends Schema.TaggedError<NotFound>()(
  "NotFound",
  { id: Schema.Number }
) {}
// #endregion class

// #region union
// `Union` is "one of these". With `TaggedStruct`, each member carries a literal
// `_tag`, so the union is a discriminated one — decode picks the right member by
// its tag, and `Match`/`switch` on `_tag` stays exhaustive.
export const Shape = Schema.Union([
  Schema.TaggedStruct("circle", { radius: Schema.Number }),
  Schema.TaggedStruct("rect", { width: Schema.Number, height: Schema.Number })
])
export type Shape = Schema.Schema.Type<typeof Shape>

export const Role = Schema.Literals(["admin", "member", "guest"])
// #endregion union

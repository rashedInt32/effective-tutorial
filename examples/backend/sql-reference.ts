import { Effect, Schema } from "effect"
import { Model } from "effect/unstable/schema"
import { Migrator, SqlClient, SqlModel, SqlResolver, SqlSchema } from "effect/unstable/sql"

// `effect/unstable/sql` is the database toolkit: one `SqlClient` service exposing
// a safe `sql` tagged template, plus typed queries, batched resolvers, table
// models, and a migrator. The CORE is driver-agnostic — every region below
// typechecks against effect@4 beta and only needs a connection layer at the edge
// (see the Postgres / SQLite menus on the page). All of these require `SqlClient`.

// #region client
// Pull the client, run a query. A `sql\`...\`` template IS an Effect of rows.
export const allUsers = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql`SELECT id, name FROM users`
  return rows // ReadonlyArray<{...}>
})
// #endregion client

// #region template
// Interpolated values become BOUND PARAMETERS — never string-concatenated — so
// the template is injection-safe by construction. Helpers build clauses for you.
export const search = (email: string, ids: ReadonlyArray<number>) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    // ${email} is sent as a parameter, not spliced into the SQL text
    const byEmail = yield* sql`SELECT * FROM users WHERE email = ${email}`

    // sql.in expands a list into (?, ?, ?) with one bound param each
    const byIds = yield* sql`SELECT * FROM users WHERE id IN ${sql.in(ids)}`

    // sql.and joins clauses with AND; a nested sql`...` is a reusable Fragment
    const active = yield* sql`SELECT * FROM users WHERE ${sql.and(["active = true", sql`id IN ${sql.in(ids)}`])}`

    return [byEmail, byIds, active] as const
  })
// #endregion template

// #region write
// `sql.insert` and `sql.update` turn a record into the right clause — column
// names and bound values, in the dialect's syntax.
export const createUser = (name: string, email: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    yield* sql`INSERT INTO users ${sql.insert({ name, email })}`
    yield* sql`UPDATE users SET ${sql.update({ name })} WHERE email = ${email}`
  })
// #endregion write

// #region transaction
// `withTransaction` wraps an effect in BEGIN/COMMIT (ROLLBACK on failure). Every
// query inside it enlists automatically; nested calls become SAVEPOINTs.
export const transfer = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql.withTransaction(
    Effect.gen(function* () {
      yield* sql`UPDATE accounts SET balance = balance - 100 WHERE id = 1`
      yield* sql`UPDATE accounts SET balance = balance + 100 WHERE id = 2`
    })
  )
})
// #endregion transaction

// #region schema
// `SqlSchema` wraps a raw query with a Schema on each side: the request is
// encoded in, the rows are decoded out — so you work in typed values, not `any`.
class User extends Schema.Class<User>("User")({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String
}) {}

// findOne -> the first row (or NoSuchElementError); findAll -> a typed array.
export const getUserById = SqlSchema.findOne({
  Request: Schema.Number,
  Result: User,
  execute: (id) => Effect.flatMap(SqlClient.SqlClient, (sql) => sql`SELECT * FROM users WHERE id = ${id}`)
})
// getUserById(1): Effect<User, NoSuchElementError | SchemaError | SqlError, SqlClient>
// #endregion schema

// #region resolver
// A resolver BATCHES concurrent by-id lookups into one `WHERE id IN (...)` query,
// then routes each row back to its caller — the classic N+1 fix.
export const UserById = SqlResolver.findById({
  Id: Schema.Number,
  Result: User,
  ResultId: (user) => user.id,
  execute: (ids) =>
    Effect.flatMap(SqlClient.SqlClient, (sql) => sql`SELECT * FROM users WHERE id IN ${sql.in(ids)}`)
})

// Two requests issued concurrently collapse into a single round-trip.
export const loadUsers = Effect.all(
  [SqlResolver.request(1, UserById), SqlResolver.request(2, UserById)],
  { concurrency: "unbounded" }
)
// #endregion resolver

// #region model
// A `Model.Class` describes a table once and derives variants: the full row, the
// `insert` shape, the `update` shape, and a json api shape. Field helpers say
// which variants each column belongs to — `GeneratedByApp` is an id you mint in
// the app (a UUID) present on every write; `GeneratedByDb` marks a db-filled
// column (a serial) that shows up on reads only.
const UserId = Schema.String.pipe(Schema.brand("UserId"))

class UserModel extends Model.Class<UserModel>("UserModel")({
  id: Model.GeneratedByApp(UserId), // app-minted id, present on insert + update
  name: Schema.String,
  email: Schema.String,
  createdAt: Model.DateTimeInsertFromDate, // stamped on insert
  updatedAt: Model.DateTimeUpdateFromDate // stamped on every update
}) {}

// `makeRepository` derives insert / update / findById / delete — all typed to the
// model's variants, all requiring only `SqlClient`.
export const makeUserRepo = SqlModel.makeRepository(UserModel, {
  tableName: "users",
  spanPrefix: "Users",
  idColumn: "id"
})
// #endregion model

// #region migrator
// Each migration is an Effect that uses `sql`. The migrator records which ran in
// a table and applies only the pending ones, in id order, inside a transaction.
export const runMigrations = Migrator.make({})({
  loader: Migrator.fromRecord({
    "0001_create_users": Effect.flatMap(SqlClient.SqlClient, (sql) =>
      Effect.asVoid(sql`CREATE TABLE users (id integer primary key, name text, email text unique)`)
    ),
    "0002_add_active": Effect.flatMap(SqlClient.SqlClient, (sql) =>
      Effect.asVoid(sql`ALTER TABLE users ADD COLUMN active boolean DEFAULT true`)
    )
  })
})
// #endregion migrator

// #region errors
// Every failure is one `SqlError` carrying a structured `reason`. Branch on the
// reason tag — and note some reasons (deadlock, serialization, timeouts) report
// `isRetryable`, so a blanket `Effect.retry` does the right thing.
export const safeCreate = createUser("Ada", "ada@example.com").pipe(
  Effect.catchTag("SqlError", (error) =>
    error.reason._tag === "UniqueViolation"
      ? Effect.succeed(`already exists: ${error.reason.constraint}`)
      : Effect.fail(error)
  )
)
// #endregion errors

// #region capstone
// The pieces composed: migrate, write, then read back through the typed query —
// one effect that needs only `SqlClient`. Provide a driver layer at the edge
// (Postgres or SQLite — see the connect menu) and this becomes runnable.
export const program = Effect.gen(function* () {
  yield* runMigrations
  yield* createUser("Ada", "ada@example.com")
  const ada = yield* getUserById(1)
  return ada // a typed User
})
// #endregion capstone

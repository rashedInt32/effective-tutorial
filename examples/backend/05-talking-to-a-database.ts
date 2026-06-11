import { Context, Effect, Layer, Schema } from "effect"
import { Migrator, SqlClient, SqlSchema } from "effect/unstable/sql"
import { HttpRouter, HttpServerRespondable, HttpServerResponse } from "effect/unstable/http"

// Lesson 04 hid storage behind a `UserRepo` service with an in-memory Map. Now we
// make it real. `effect/unstable/sql` gives you ONE `SqlClient` service: a safe
// `sql` tagged template plus typed queries, transactions, and migrations. The
// core is driver-agnostic — every region here typechecks against effect@4 beta
// and only needs a connection layer at the very edge (Postgres or SQLite). The
// shape from Lesson 04 is unchanged: the repo is still a service you ASK for; we
// only swap its Layer for one backed by the database.

// #region client
// Pull the client and run a query. A `sql\`...\`` template IS an Effect of rows —
// no callbacks, no manual connection handling. Every query requires `SqlClient`.
export const allUsers = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql`SELECT id, name FROM users`
  return rows // ReadonlyArray<{...}>
})
// #endregion client

// #region safe
// Interpolated values become BOUND PARAMETERS — never spliced into the SQL text —
// so the template is injection-safe by construction. `sql.in` expands a list into
// (?, ?, ?); `sql.insert` / `sql.update` turn a record into the right clause.
export const writes = (name: string, ids: ReadonlyArray<number>) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    yield* sql`SELECT * FROM users WHERE id IN ${sql.in(ids)}`
    yield* sql`INSERT INTO users ${sql.insert({ name })}`
    yield* sql`UPDATE users SET ${sql.update({ name })} WHERE name = ${name}`
  })
// #endregion safe

// #region model
// The typed value our repo returns, plus a self-rendering 404 (Lesson 03/04).
export class User extends Schema.Class<User>("User")({
  id: Schema.Number,
  name: Schema.NonEmptyString
}) {}

export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  { id: Schema.Number }
) {
  [HttpServerRespondable.symbol]() {
    return HttpServerResponse.json({ error: this._tag, id: this.id }, { status: 404 })
  }
}
// #endregion model

// #region typed
// Raw rows are `unknown`-ish. `SqlSchema` wraps a query with a Schema on each
// side: the request is encoded IN, the rows are decoded OUT — so you work in
// typed values, and a row that doesn't fit the schema fails loudly.
const findUserQuery = SqlSchema.findOne({
  Request: Schema.Number,
  Result: User,
  execute: (id) =>
    Effect.flatMap(SqlClient.SqlClient, (sql) => sql`SELECT id, name FROM users WHERE id = ${id}`)
})
// findUserQuery(1): Effect<User, NoSuchElementError | SchemaError | SqlError, SqlClient>
// — `findOne` fails with NoSuchElementError when there's no row (not an Option).
// #endregion typed

// #region repo
// Same service as Lesson 04 — only the Layer changes. `Layer.effect` builds the
// repo from an Effect that ASKS for `SqlClient`, so the dependency shows up in
// the layer's type. Handlers still just yield `UserRepo`; they never see SQL.
export class UserRepo extends Context.Service<UserRepo, {
  readonly findById: (id: number) => Effect.Effect<User, UserNotFound>
  readonly create: (name: string) => Effect.Effect<User>
}>()("app/UserRepo") {}

export const UserRepoLive = Layer.effect(
  UserRepo,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    return {
      findById: (id) =>
        // Provide the captured client to the query, then translate its outcomes:
        // a missing row or a decode failure both become the domain `UserNotFound`
        // the caller declared; a `SqlError` is infrastructure, not a domain error,
        // so it becomes a defect via `orDie`.
        findUserQuery(id).pipe(
          Effect.provideService(SqlClient.SqlClient, sql),
          Effect.catchTag("NoSuchElementError", () => Effect.fail(new UserNotFound({ id }))),
          Effect.catchTag("SchemaError", () => Effect.fail(new UserNotFound({ id }))),
          Effect.orDie
        ),
      create: (name) =>
        sql`INSERT INTO users ${sql.insert({ name })} RETURNING id, name`.pipe(
          Effect.map((rows) => new User(rows[0] as { id: number; name: string })),
          Effect.orDie
        )
    }
  })
)
// #endregion repo

// #region transaction
// `withTransaction` wraps an effect in BEGIN/COMMIT (ROLLBACK on failure). Every
// query inside enlists automatically; nested calls become SAVEPOINTs. Either
// both writes land, or neither does.
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

// #region errors
// Every failure is one `SqlError` carrying a structured `reason`. Branch on the
// reason tag to turn an expected database condition into a clean result — here a
// duplicate insert becomes a message instead of a crash.
export const safeCreate = (name: string) =>
  Effect.flatMap(SqlClient.SqlClient, (sql) => sql`INSERT INTO users ${sql.insert({ name })}`).pipe(
    Effect.catchTag("SqlError", (error) =>
      error.reason._tag === "UniqueViolation"
        ? Effect.succeed(`already exists: ${error.reason.constraint}`)
        : Effect.fail(error)
    )
  )
// #endregion errors

// #region migrate
// Schema lives in code. Each migration is an Effect that uses `sql`; the migrator
// records which ran and applies only the pending ones, in id order, inside a
// transaction. Run it once on boot, before serving traffic.
export const runMigrations = Migrator.make({})({
  loader: Migrator.fromRecord({
    "0001_create_users": Effect.flatMap(SqlClient.SqlClient, (sql) =>
      Effect.asVoid(sql`CREATE TABLE users (id integer primary key, name text not null)`)
    )
  })
})
// #endregion migrate

// #region capstone
// The whole story end to end: a route asks `UserRepo` for a user and encodes it
// through the schema. `Layer.provide(UserRepoLive)` satisfies the repo, which in
// turn requires `SqlClient` — so the routes layer's one remaining requirement is
// a driver. Provide a Postgres or SQLite connection layer at the edge (see the
// sql whole-map) and migrate on boot, and this is a real database-backed server.
export const Routes = HttpRouter.addAll([
  HttpRouter.route(
    "GET",
    "/users/1",
    Effect.gen(function* () {
      const repo = yield* UserRepo
      const user = yield* repo.findById(1) // UserNotFound renders itself as 404
      return yield* HttpServerResponse.schemaJson(User)(user)
    })
  )
]).pipe(Layer.provide(UserRepoLive)) // Layer<…, …, SqlClient> — needs a driver
// #endregion capstone

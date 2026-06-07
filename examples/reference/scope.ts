import { Context, Effect, Layer } from "effect"

// A "resource" is anything that must be released — a connection, a file handle, a
// lock. `acquireRelease` pairs opening it with a release step that ALWAYS runs:
// on success, on failure, and on interruption. That release is tied to a `Scope`.

interface Conn {
  readonly query: (sql: string) => Effect.Effect<string>
}
declare const openConn: Effect.Effect<Conn>
declare const closeConn: (conn: Conn) => Effect.Effect<void>

// #region acquire-release
// Pair acquire + release. The result REQUIRES a `Scope`, and the release is
// guaranteed to run when that scope closes — no matter how the effect ends.
const connection = Effect.acquireRelease(
  openConn,
  (conn) => closeConn(conn) // release; also receives the Exit if you need it
) // Effect<Conn, never, Scope>
// #endregion acquire-release

// #region scoped
// `Effect.scoped` provides the Scope and runs every finalizer when the block
// ends — so the connection is open exactly for its use, then closed. Note that
// `Scope` has left the requirements: the effect is self-contained.
export const program = connection.pipe(
  Effect.flatMap((conn) => conn.query("SELECT 1")),
  Effect.scoped
) // Effect<string>
// #endregion scoped

// #region layer-scoped
// A service that OWNS a resource is just `Layer.effect` over a scoped acquire: it
// opens when the layer is built and closes when the layer is torn down. (v4 folds
// the old `Layer.scoped` into `Layer.effect`.) Consumers only ask for Database.
class Database extends Context.Service<Database, Conn>()("app/Database") {}

export const DatabaseLive = Layer.effect(Database, connection)
// Layer<Database, never, never> — the Scope is discharged at layer teardown
// #endregion layer-scoped

import { Config, Effect } from "effect"

// Configuration as a typed, composable value. A `Config<A>` describes WHERE a
// value comes from and HOW to parse it. Because a Config is itself an Effect, you
// read it by yielding — and a missing or invalid value becomes a typed
// ConfigError instead of a surprise `undefined`.

// #region declare
// Each primitive reads one named value and parses it to a type. `withDefault`
// makes one optional; `redacted` keeps a secret out of logs and error messages.
const port = Config.port("PORT").pipe(Config.withDefault(3000))
const host = Config.string("HOST").pipe(Config.withDefault("0.0.0.0"))
const apiKey = Config.redacted("API_KEY") // Config<Redacted<string>>
// #endregion declare

// #region compose
// `Config.all` combines several configs into one structured value; `nested`
// scopes a group under a prefix (so this reads DB_HOST, DB_PORT, ...).
const ServerConfig = Config.all({ host, port })

export const DbConfig = Config.all({
  host: Config.string("HOST"),
  port: Config.port("PORT")
}).pipe(Config.nested("DB"))
// #endregion compose

// #region read
// A Config IS an Effect, so you read it with `yield*`. Anything missing or
// malformed fails the effect with a ConfigError — no `process.env.X!` casts.
export const program = Effect.gen(function* () {
  const server = yield* ServerConfig
  const key = yield* apiKey
  yield* Effect.log(`listening on ${server.host}:${server.port}`)
  return { server, key }
})
// #endregion read

let parse = require('@architect/parser')
let dotenv = require('dotenv')
let { join } = require('path')
let { existsSync, readFileSync } = require('fs')

/**
 * Initialize process.env with .arc-env
 * - If NODE_ENV=staging the process.env is populated by @staging (etc)
 * - If ARC_LOCAL is present process.env is populated by @testing (so you can access remote dynamo locally)
 */
module.exports = function populateEnv (params, callback) {
  let { update } = params
  let dotEnvPath = join(process.cwd(), '.env')
  let legacyArcEnvPath = join(process.cwd(), '.arc-env')
  if (existsSync(dotEnvPath)) {
    try {
      let raw = readFileSync(dotEnvPath).toString()
      let env = dotenv.parse(raw)
      Object.entries(env).forEach(([ n, v ]) => {
        process.env[n] = v
      })
      let msg = 'Populating environment variables with .env'
      update.done(msg)
      callback()
    }
    catch (err) {
      let error = `.env parse error: ${err.stack}`
      callback(error)
    }
  }
  else if (existsSync(legacyArcEnvPath)) {
    try {
      let raw = readFileSync(legacyArcEnvPath).toString()
      let env = parse(raw)
      let actual = process.env.ARC_LOCAL
        ? 'testing'
        : process.env.NODE_ENV
      if (env[actual]) {
        env[actual].forEach(tuple => {
          process.env[tuple[0]] = tuple[1]
        })
        let local = 'Populating environment variables with .arc-env @testing (ARC_LOCAL override)'
        let not = 'Populating environment variables with .arc-env @' + process.env.NODE_ENV
        let msg = process.env.ARC_LOCAL ? local : not
        update.done(msg)
      }
      callback()
    }
    catch (err) {
      let error = `.arc-env parse error: ${err.stack}`
      callback(error)
    }
  }
  else callback()
}

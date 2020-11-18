let parse = require('@architect/parser')
let dotenv = require('dotenv')
let { join, basename } = require('path')
let { existsSync, readFileSync } = require('fs')

/**
 * Initialize process.env with .arc-env
 * - If NODE_ENV=staging the process.env is populated by @staging (etc)
 * - If ARC_LOCAL is present process.env is populated by @testing (so you can access remote dynamo locally)
 */
module.exports = function populateEnv (params, callback) {
  let { update, inventory } = params
  let { inv } = inventory
  let environment = process.env.NODE_ENV

  function varsNotFound (env, file) {
    let msg = `No ${env} environment variables found` + (file ? ` in ${file}` : '')
    update.done(msg)
  }
  function populatePrint (env, file) {
    update.done(`Populating ${env} environment variables with ${file}`)
    if (process.env.ARC_LOCAL) {
      let live = [
        inv.tables ? '@tables' : '',
        inv.indexes ? '@indexes' : '',
        inv.events ? '@events' : '',
        inv.queues ? '@queues' : '',
      ].filter(Boolean)
      update.done(`Using ${env} live AWS infra: ${live.join(', ')}`)
    }
  }

  let dotEnvPath = join(process.cwd(), '.env')
  let legacyArcEnvPath = join(process.cwd(), '.arc-env')
  if (existsSync(dotEnvPath)) {
    try {
      let raw = readFileSync(dotEnvPath).toString()
      let env = dotenv.parse(raw)
      populate(env)
      populatePrint('testing', '.env')
      callback()
    }
    catch (err) {
      let error = `.env parse error: ${err.stack}`
      callback(error)
    }
  }
  else if (inv._project.preferences) {
    let prefs = inv._project.preferences
    let { sandbox = {} } = prefs

    // Environment prefs
    if (sandbox.env) process.env.NODE_ENV = environment = sandbox.env
    if (sandbox.useAWS) process.env.ARC_LOCAL = true

    // Populate env vars
    let filepath = basename(inv._project.preferencesFile)
    if (prefs.env && prefs.env[environment]) {
      populate(prefs.env[environment])
      populatePrint(environment, filepath)
    }
    else varsNotFound(environment, filepath)
    callback()
  }
  else if (existsSync(legacyArcEnvPath)) {
    try {
      let raw = readFileSync(legacyArcEnvPath).toString()
      let env = parse(raw)
      if (env[environment]) {
        env[environment].forEach(tuple => {
          process.env[tuple[0]] = tuple[1]
        })
        populatePrint(environment, '.arc-env')
      }
      else varsNotFound(environment, '.arc-env')
      callback()
    }
    catch (err) {
      let error = `.arc-env parse error: ${err.stack}`
      callback(error)
    }
  }
  else {
    varsNotFound(environment)
    callback()
  }
}

function populate (env) {
  Object.entries(env).forEach(([ n, v ]) => {
    process.env[n] = v
  })
}

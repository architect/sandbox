let parse = require('@architect/parser')
let dotenv = require('dotenv')
let { join, basename, sep } = require('path')
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
  let setEnv = false

  function varsNotFound (env, file) {
    let msg = `No ${env} environment variables found` + (file ? ` in ${file}` : '')
    update.done(msg)
  }
  function populatePrint (env, file) {
    update.done(`Found ${env} environment variables: ${file}`)
  }

  let dotEnvPath = join(process.cwd(), '.env')
  let legacyArcEnvPath = join(process.cwd(), '.arc-env')
  if (existsSync(dotEnvPath)) {
    try {
      let raw = readFileSync(dotEnvPath).toString()
      let env = dotenv.parse(raw)
      populate(env)
      setEnv = true
      populatePrint('testing', '.env')
    }
    catch (err) {
      let error = `.env parse error: ${err.stack}`
      callback(error)
      return
    }
  }
  if (inv._project.preferences) {
    let prefs = inv._project.preferences
    let { sandbox = {} } = prefs

    // Environment prefs
    if (sandbox.env) process.env.ARC_ENV = process.env.NODE_ENV = environment = sandbox.env
    if (sandbox.useAWS) {
      process.env.ARC_LOCAL = true
      if (process.env.NODE_ENV === 'testing') process.env.NODE_ENV = 'staging'
    }

    // Populate env vars
    if (prefs.env && prefs.env[environment] && !setEnv) {
      let proj = inv._project
      let global =  proj.globalPreferences &&
                    proj.globalPreferences.env &&
                    proj.globalPreferences.env[environment] &&
                    `~${sep}${basename(proj.globalPreferencesFile)}`
      let local =   proj.localPreferences &&
                    proj.localPreferences.env &&
                    proj.localPreferences.env[environment] &&
                    basename(proj.localPreferencesFile)
      let filepath = local || global || null
      populate(prefs.env[environment])
      populatePrint(environment, filepath)
    }
    else if (!setEnv) varsNotFound(environment)
  }
  else if (existsSync(legacyArcEnvPath)) {
    try {
      let raw = readFileSync(legacyArcEnvPath).toString()
      let env = parse(raw)
      if (env[environment] && !setEnv) {
        env[environment].forEach(tuple => {
          process.env[tuple[0]] = tuple[1]
        })
        populatePrint(environment, '.arc-env')
      }
      else if (!setEnv) varsNotFound(environment, '.arc-env')
    }
    catch (err) {
      let error = `.arc-env parse error: ${err.stack}`
      callback(error)
      return
    }
  }
  else if (!setEnv) varsNotFound(environment)

  // Wrap it up
  if (process.env.ARC_LOCAL) {
    let live = [
      inv.tables ? '@tables' : '',
      inv.indexes ? '@indexes' : '',
      inv.events ? '@events' : '',
      inv.queues ? '@queues' : '',
    ].filter(Boolean)
    update.done(`Using ${process.env.ARC_ENV} live AWS infra: ${live.join(', ')}`)
  }
  callback()
}

function populate (env) {
  Object.entries(env).forEach(([ n, v ]) => {
    process.env[n] = v
  })
}

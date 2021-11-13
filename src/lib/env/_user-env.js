let parse = require('@architect/parser')
let dotenv = require('dotenv')
let { join, basename, sep } = require('path')
let { existsSync, readFileSync } = require('fs')

/**
 * Initialize Lambdas with local environment variable settings
 * - e.g. if ARC_ENV=staging the Lambda env is populated by `@staging`, etc.
 */
module.exports = function populateUserEnv (params, callback) {
  let { cwd, update, inventory, env } = params
  let { inv } = inventory
  let environment = process.env.ARC_ENV
  let setEnv = false // Ignore the second set of env vars if both .env + Arc prefs are found
  let userEnv = {}

  function varsNotFound (env, file) {
    let msg = `No ${env} environment variables found` + (file ? ` in ${file}` : '')
    update.done(msg)
  }
  function print (env, file) {
    update.done(`Found ${env} environment variables: ${file}`)
  }

  let dotEnvPath = join(cwd, '.env')
  let legacyArcEnvPath = join(cwd, '.arc-env')
  if (existsSync(dotEnvPath)) {
    try {
      let raw = readFileSync(dotEnvPath).toString()
      let env = dotenv.parse(raw)
      userEnv = env
      setEnv = true
      print('testing', '.env')
    }
    catch (err) {
      let error = `.env parse error: ${err.stack}`
      return callback(error)
    }
  }
  if (inv._project.preferences) {
    let prefs = inv._project.preferences

    // Local environment override
    if (prefs?.sandbox?.env) {
      process.env.ARC_ENV = environment = prefs.sandbox.env
    }
    // If useAWS is specified, force an AWS environment name
    // TODO [REMOVE]: in a future breaking change where we stop relying on NODE_ENV, we can prob drop this; setting ARC_LOCAL is now handled during Lambda invocation
    if (prefs?.sandbox?.useAWS &&
        ![ 'staging', 'production' ].includes(process.env.NODE_ENV)) {
      process.env.NODE_ENV = 'staging'
    }

    // Populate env vars
    if (prefs?.env?.[environment] && !setEnv) {
      let proj =  inv._project
      let global =  proj?.globalPreferences?.env?.[environment] &&
                    `~${sep}${basename(proj.globalPreferencesFile)}`
      let local =   proj?.localPreferences?.env?.[environment] &&
                    basename(proj.localPreferencesFile)
      let filepath = local || global || null
      userEnv = prefs.env[environment]
      print(environment, filepath)
    }
    else if (!setEnv) varsNotFound(environment)
  }
  else if (existsSync(legacyArcEnvPath)) {
    try {
      let raw = readFileSync(legacyArcEnvPath).toString()
      let env = parse(raw)
      if (env[environment] && !setEnv) {
        let legacyArcEnv = {}
        env[environment].forEach(tuple => {
          legacyArcEnv[tuple[0]] = tuple[1]
        })
        userEnv = legacyArcEnv
        print(environment, '.arc-env')
      }
      else if (!setEnv) varsNotFound(environment, '.arc-env')
    }
    catch (err) {
      let error = `.arc-env parse error: ${err.stack}`
      return callback(error)
    }
  }
  else if (!setEnv && !env) varsNotFound(environment)

  if (env) {
    Object.entries(env).forEach(entry => {
      let [ key, value ] = entry
      if (typeof value === 'string') userEnv[key] = value
      else if (typeof value === 'undefined') delete userEnv[key]
      else {
        let error = `env option '${key}' parse error: ${new Error().stack}`
        return callback(error)
      }
    })
    print('testing', 'env option')
  }

  // Wrap it up
  if (inv._project?.preferences?.sandbox?.useAWS || process.env.ARC_LOCAL) {
    let live = [
      inv.tables ? '@tables' : '',
      inv.indexes ? '@indexes' : '',
      inv.events ? '@events' : '',
      inv.queues ? '@queues' : '',
    ].filter(Boolean)
    update.done(`Using ${process.env.ARC_ENV} live AWS infra: ${live.join(', ')}`)
  }

  callback(null, userEnv)
}

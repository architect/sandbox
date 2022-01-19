let { join, basename, sep } = require('path')
let { existsSync } = require('fs')

/**
 * Initialize Lambdas with local environment variable settings
 * - e.g. if ARC_ENV=staging the Lambda env is populated by `@staging`, etc.
 */
module.exports = function populateUserEnv (params, callback) {
  let { cwd, update, inventory, env: envOption } = params
  let { inv } = inventory
  let { _project: proj } = inv

  let environment = process.env.ARC_ENV
  let env = proj.env.local
  let prefs = proj.preferences
  let dotEnvPath = join(cwd, '.env')
  let userEnv

  function varsNotFound (env, file) {
    let msg = `No ${env} environment variables found` + (file ? ` in ${file}` : '')
    update.done(msg)
  }
  function print (env, file) {
    update.done(`Found ${env} environment variables: ${file}`)
  }

  // User passed in an `env` object to the module API
  if (envOption) {
    userEnv = {}
    let probs = []
    try {
      Object.entries(envOption).forEach(([ key, value ]) => {
        if (typeof value === 'string') userEnv[key] = value
        else probs.push(`- '${key}' must be a string`)
      })
    }
    catch (err) {
      return callback(err)
    }
    if (probs.length) {
      let msg = `Sandbox \`env\` option parsing error:\n- ${probs.join('\n- ')}`
      return callback(Error(msg))
    }
    print('testing', 'env option')
  }

  // User has a `.env` file
  if (!userEnv && existsSync(dotEnvPath)) {
    userEnv = env.testing
    print('testing', '.env')
  }

  // User has a `pref[erence]s.arc` file
  if (prefs) {
    // Local environment override
    if (prefs?.sandbox?.env) {
      process.env.ARC_ENV = environment = prefs.sandbox.env
    }
    // If useAWS is specified, force an AWS environment name
    if (prefs?.sandbox?.useAWS &&
        ![ 'staging', 'production' ].includes(process.env.ARC_ENV)) {
      process.env.ARC_ENV = 'staging'
    }

    // Populate env vars
    if (env[environment] && !userEnv) {
      userEnv = env[environment]
      let global =  proj?.globalPreferences?.env?.[environment] &&
                    `~${sep}${basename(proj.globalPreferencesFile)}`
      let local =   proj?.localPreferences?.env?.[environment] &&
                    basename(proj.localPreferencesFile)
      let filepath = local || global
      print(environment, filepath)
    }
  }
  if (!userEnv) varsNotFound(environment)

  // Wrap it up
  if (proj?.preferences?.sandbox?.useAWS || process.env.ARC_LOCAL) {
    let live = [
      inv.tables ? '@tables' : '',
      inv['tables-indexes'] ? '@tables-indexes' : '',
      inv.indexes ? '@indexes' : '',
      inv.events ? '@events' : '',
      inv.queues ? '@queues' : '',
    ].filter(Boolean)
    update.done(`Using ${process.env.ARC_ENV} live AWS infra: ${live.join(', ')}`)
  }

  params.userEnv = userEnv || {}
  callback()
}

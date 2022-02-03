let { join, basename, sep } = require('path')
let { existsSync } = require('fs')

/**
 * Initialize Lambdas with local environment variable settings
 * - e.g. if ARC_ENV=staging the Lambda env is populated by `@staging`, etc.
 */
module.exports = function validateUserEnv (params, callback) {
  let { cwd, env: envOption, inventory, restart, update } = params
  let { inv } = inventory
  let { _project: proj } = inv

  let environment = process.env.ARC_ENV
  let localEnv = proj.env.local
  let prefs = proj.preferences
  let validName = /^[a-zA-Z0-9_]+$/
  let foundEnv

  function varsNotFound (env) {
    if (restart) return
    update.done(`No custom ${env} environment variables found`)
  }
  function print (env, file) {
    if (restart) return
    update.done(`Found ${env} environment variables: ${file}`)
  }

  // Users may change ARC_ENV via preferences
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
  }

  // User passed in an `env` object to the module API
  if (envOption) {
    let probs = []
    try {
      Object.entries(envOption).forEach(([ key, /* value */ ]) => {
        if (!validName.test(key)) {
          probs.push(`- Env var '${key}' is invalid, must be [a-zA-Z0-9_]`)
        }
        // TODO add value validation
      })
    }
    catch (err) {
      return callback(err)
    }
    if (probs.length) {
      let msg = `Sandbox \`env\` option parsing error:\n- ${probs.join('\n- ')}`
      return callback(Error(msg))
    }
    foundEnv = true
    print(environment, 'env option')
  }

  // Populate env vars
  if (!foundEnv && localEnv?.[environment]) {
    let dotEnvPath = join(cwd, '.env')
    let dotEnv =    existsSync(dotEnvPath) && dotEnvPath
    let local =     proj?.localPreferences?.env?.[environment] && proj.localPreferencesFile
    let global =    proj?.globalPreferences?.env?.[environment] && proj.globalPreferencesFile
    let filepath =  (dotEnv) && basename(dotEnv) ||
                    (local && basename(local)) ||
                    (global && `~${sep}${basename(global)}`)
    foundEnv = true
    print(environment, filepath)
  }
  if (!foundEnv) varsNotFound(environment)

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

  callback()
}

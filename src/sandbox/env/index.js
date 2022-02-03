let { banner } = require('@architect/utils')
let userEnv = require('./_user-env')

let allowed = [ 'testing', 'staging', 'production' ]

module.exports = function populateEnv (params, callback) {
  let { cwd, inventory, restart, update } = params
  let { inv } = inventory
  let { ARC_ENV } = process.env

  /**
   * Ensure ARC_ENV is one of: 'testing', 'staging', or 'production'
   * - By default, set (or override) to 'testing'
   */
  if (!ARC_ENV || !allowed.includes(ARC_ENV)) {
    process.env.ARC_ENV = 'testing'
  }

  // Print the banner
  if (!restart) {
    banner(params)
  }

  // Warn about a missing manifest (if appropriate)
  if (!inv._project.manifest && !restart) {
    update.warn('No Architect project manifest found, using default project')
  }
  else if (!restart) {
    let file = inv._project.manifest.replace(cwd, '').substr(1)
    update.done(`Found Architect project manifest: ${file}`)
  }

  // Validate / print status of userland env vars
  userEnv(params, callback)
}

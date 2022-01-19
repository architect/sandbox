let series = require('run-series')
let { banner } = require('@architect/utils')
let userEnv = require('./_user-env')
let ports = require('./_ports')

let allowed = [ 'testing', 'staging', 'production' ]

module.exports = function populateEnv (params, callback) {
  let { cwd, inventory, update } = params
  let { inv } = inventory
  let { ARC_ENV } = process.env

  /**
   * Ensure ARC_ENV is one of: 'testing', 'staging', or 'production'
   * - By default, set (or override) to 'testing'
   */
  if (!ARC_ENV || !allowed.includes(ARC_ENV)) {
    process.env.ARC_ENV = 'testing'
  }

  // Warn about a missing manifest (if appropriate)
  if (!inv._project.manifest) {
    update.warn('No Architect project manifest found, using default project')
  }
  else {
    let file = inv._project.manifest.replace(cwd, '').substr(1)
    update.done(`Found Architect project manifest: ${file}`)
  }

  // Print the banner
  banner(params)

  series([
    function (callback) {
      userEnv(params, callback)
    },
    function (callback) {
      ports(params, (err, ports) => {
        if (err) callback(err)
        else {
          params.ports = ports
          update.verbose.done(`Using ports: ` +
                              `http: ${ports.http || 'n/a'}, ` +
                              `events/queues: ${ports.events || 'n/a'}, ` +
                              `tables: ${ports.tables || 'n/a'}, ` +
                              `_arc: ${ports._arc || 'n/a'}`)
          callback()
        }
      })
    },
  ], callback)
}

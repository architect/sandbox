let { toLogicalID } = require('@architect/utils')

/**
 * Handle important Architect environment variables
 */
module.exports = function env (params, callback) {
  let { version, quiet, inventory } = params
  let { inv } = inventory

  // Set up quietude
  process.env.ARC_QUIET = process.env.ARC_QUIET || process.env.QUIET || quiet || '' // For when sandbox is being run outside of @arc/arc

  /**
   * Ensure env is one of: 'testing', 'staging', or 'production'
   * - By default, set (or override) to 'testing'
   * - Some test harnesses (ahem) will automatically populate NODE_ENV with their own values, unbidden
   */
  let env = process.env.NODE_ENV
  let isNotStagingOrProd = env !== 'staging' && env !== 'production'
  if (!env || isNotStagingOrProd) {
    process.env.NODE_ENV = 'testing'
  }

  // Set Arc 5 / 6+ Lambda config env
  if (version && version.startsWith('Architect 5') || process.env.DEPRECATED) {
    process.env.DEPRECATED = true
    process.env.ARC_HTTP = 'aws'
  }
  else {
    process.env.ARC_HTTP = 'aws_proxy'
    if (env === 'staging' || env === 'production') {
      let capEnv = env.charAt(0).toUpperCase() + env.substr(1)
      process.env.ARC_CLOUDFORMATION = `${toLogicalID(inv.app)}${capEnv}`
    }

    // @static spa
    if (inv.static && inv.static.spa !== undefined) process.env.ARC_STATIC_SPA = inv.static
  }

  // Populate session table (if not present)
  if (!process.env.SESSION_TABLE_NAME) {
    process.env.SESSION_TABLE_NAME = 'jwe'
  }

  // Declare a bucket for implicit proxy
  process.env.ARC_STATIC_BUCKET = 'sandbox'

  callback()
}

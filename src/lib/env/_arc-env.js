/**
 * Handle important Architect environment variables
 */
module.exports = function env (params, callback) {
  let { ARC_ENV } = process.env
  let allowed = [ 'testing', 'staging', 'production' ]

  /**
   * Ensure ARC_ENV is one of: 'testing', 'staging', or 'production'
   * - By default, set (or override) to 'testing'
   */
  if (!ARC_ENV || !allowed.includes(ARC_ENV)) {
    process.env.ARC_ENV = 'testing'
  }

  callback()
}

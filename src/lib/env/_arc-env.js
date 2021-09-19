/**
 * Handle important Architect environment variables
 */
module.exports = function env (params, callback) {
  let { ARC_ENV, NODE_ENV } = process.env

  /**
   * Ensure ARC_ENV is one of: 'testing', 'staging', or 'production'; NODE_ENV can be whatever (but ideally the same)
   * - By default, set (or override) to 'testing'
   * - Some test harnesses (ahem) will automatically populate NODE_ENV with their own values, unbidden
   */
  if (!ARC_ENV && !NODE_ENV) {
    process.env.ARC_ENV = process.env.NODE_ENV = 'testing'
  }
  else if (!ARC_ENV && NODE_ENV) {
    let allowed = [ 'testing', 'staging', 'production' ]
    process.env.ARC_ENV = allowed.includes(NODE_ENV) ? NODE_ENV : 'testing'
  }
  else if (ARC_ENV && !NODE_ENV) {
    process.env.NODE_ENV = ARC_ENV
  }

  callback()
}

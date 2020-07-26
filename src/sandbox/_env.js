let { toLogicalID } = require('@architect/utils')

module.exports = function env (params) {
  let { arc, port, version } = params

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
      process.env.ARC_CLOUDFORMATION = `${toLogicalID(arc.app[0])}${capEnv}`
    }
    let spaSetting = tuple => tuple[0] === 'spa'
    // findIndex instead of find so we don't mix up bools
    let spa = arc.static && arc.static.some(spaSetting) && arc.static.findIndex(spaSetting)
    let spaIsValid = arc.static && arc.static[spa] && typeof arc.static[spa][1] === 'boolean'
    if (spaIsValid) process.env.ARC_STATIC_SPA = arc.static[spa][1]
  }

  // Populate session table (if not present)
  if (!process.env.SESSION_TABLE_NAME) {
    process.env.SESSION_TABLE_NAME = 'jwe'
  }

  // Declare a bucket for implicit proxy
  process.env.ARC_STATIC_BUCKET = 'sandbox'

  // Set default WebSocket URL
  process.env.ARC_WSS_URL = `ws://localhost:${port}`

  return process.env.DEPRECATED
}

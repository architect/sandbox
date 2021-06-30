let invoke = require('../../invoke-lambda')
let requestFormatter = require('./_req-fmt')

/**
 * Formats WebSocket request event objects
 */
module.exports = function invokeWebSocketEvent (params, callback) {
  let { cwd, lambda, body, req, inventory, update, connectionId, domainName } = params
  let { name } = lambda

  // Only $connect + $disconnect WS invocations have headers
  if (req && req.headers) {
    // Coerce API Gateway 'Cookie' from express 'cookie'
    req.headers.Cookie = req.headers.cookie
    delete req.headers.cookie
    if (!req.headers.Cookie) delete req.headers.Cookie
  }

  // Set up request shape
  let request = requestFormatter({ name, req, body, connectionId, domainName })

  // Run the lambda sig locally
  invoke({ cwd, lambda, event: request, inventory, update }, callback)
}

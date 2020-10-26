let invoke = require('../../invoke-lambda')
let requestFormatter = require('./_req-fmt')

/**
 * Formats WebSocket request event objects
 */
function invokeWebSocketEvent (params, callback) {
  let { lambda, body, connectionId, req } = params

  // Only $connect + $disconnect WS invocations have headers
  if (req && req.headers) {
    // Coerce API Gateway 'Cookie' from express 'cookie'
    req.headers.Cookie = req.headers.cookie
    delete req.headers.cookie
    if (!req.headers.Cookie) delete req.headers.Cookie
  }

  // Set up request shape
  let request = requestFormatter({ req, body, connectionId })

  // Run the lambda sig locally
  invoke(lambda, request, callback)
}

module.exports = invokeWebSocketEvent

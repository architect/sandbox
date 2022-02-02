let URL = require('url')
let { makeRequestId } = require('../../lib')
let pool = require('../register-websocket/pool')

/**
 * Arc 6+ APIGWv2 request formatter
 * - Mocks essentials of request object shape from WS Lambda proxy integration
 */
module.exports = function requestFormatter (params) {
  let { name, req, body, connectionId, domainName } = params

  let connectedAt = params.connectedAt || pool.getConnectedAt(connectionId) || Date.now()
  let routeKey = `$${name}`
  let eventType = name === 'connect' || name === 'disconnect'
    ? name.toUpperCase()
    : 'MESSAGE'

  let request = {
    requestContext: {
      connectedAt,
      connectionId,
      domainName,
      eventType,
      messageDirection: 'IN',
      messageId: makeRequestId(),
      requestId: makeRequestId(),
      requestTimeEpoch: Date.now(),
      routeKey,
      stage: process.env.ARC_ENV || 'testing',
    },
    isBase64Encoded: false
  }

  if (name === 'disconnect') {
    request.requestContext.disconnectReason = ''
  }

  /**
   * API Gateway v1 sends a null literal instead of an empty object because reasons
   * API Gateway v2 doesn't send anything at all ¯\_(ツ)_/¯
   */
  if (body) {
    request.body = body
  }
  // Also, only $connect receives headers / query params, etc.
  if (req?.headers) {
    request.headers = req.headers
  }
  if (req?.url) {
    let { query } = URL.parse(req.url, true)
    if (Object.keys(query).length) {
      request.queryStringParameters = query
    }
  }

  return request
}

let URL = require('url')
let makeRequestId = require('../../lib/request-id')

/**
 * Arc 6+ APIGWv2 request formatter
 * - Mocks essentials of request object shape from WS Lambda proxy integration
 */
module.exports = function requestFormatter ({ req, body, connectedAt, connectionId, domainName, eventType, routeKey, additionalRequestContext }) {
  let request = {
    requestContext: {
      connectedAt,
      connectionId,
      domainName,
      eventType,
      messageDirection: 'IN',
      requestId: makeRequestId(),
      requestTimeEpoch: Date.now(),
      routeKey,
      stage: process.env.NODE_ENV || 'testing',
      ...additionalRequestContext,
    },
    isBase64Encoded: false
  }

  /**
   * API Gateway v1 sends a null literal instead of an empty object because reasons
   * API Gateway v2 doesn't send anything at all ¯\_(ツ)_/¯
   */
  if (body) {
    request.body = body
  }
  // Also, only $connect receives headers / query params, etc.
  if (req && req.headers) {
    request.headers = req.headers
  }
  if (req && req.url) {
    let { query } = URL.parse(req.url, true)
    if (Object.keys(query).length) {
      request.queryStringParameters = query
    }
  }

  return request
}

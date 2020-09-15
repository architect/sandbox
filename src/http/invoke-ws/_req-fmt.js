let URL = require('url')

/**
 * Arc 6+ APIGWv2 request formatter
 * - Mocks essentials of request object shape from WS Lambda proxy integration
 */
module.exports = function requestFormatter ({ req, body, connectionId }) {
  let request = {
    requestContext: {
      connectionId
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

let URL = require('url')

/**
 * Arc <6 request formatter
 * - Mocks request object shape from API Gateway VTL
 */
module.exports = function requestFormatterDeprecated ({ verb, req }) {
  let { body, headers, params, url } = req
  let path = URL.parse(url).pathname
  let query = URL.parse(url, true).query

  let request = {
    method: verb,
    httpMethod: verb,
    path,
    body,
    headers,
    params,
    query,
    queryStringParameters: query
  }

  return request
}

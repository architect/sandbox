let URL = require('url')
let headerFormatter = require('../rest/_req-header-fmt')

/**
 * Arc <6 request formatter
 * - Mocks request object shape from API Gateway VTL
 */
module.exports = function requestFormatterDeprecated ({ verb, req }) {
  let { body, headers, params, url } = req
  let path = URL.parse(url).pathname
  let query = URL.parse(url, true).query

  let { headers: normalizedHeaders } = headerFormatter(headers)
  // Early API Gateway x Lambda integrations coerce 'Cookie' from 'cookie', but not >6.x
  if (normalizedHeaders.cookie) {
    normalizedHeaders.Cookie = normalizedHeaders.cookie
    delete normalizedHeaders.cookie
  }

  let request = {
    method: verb,
    httpMethod: verb,
    path,
    body,
    headers: normalizedHeaders,
    params,
    query,
    queryStringParameters: query
  }

  return request
}

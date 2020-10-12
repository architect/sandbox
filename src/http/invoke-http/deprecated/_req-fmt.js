let URL = require('url')
let headerFormatter = require('../rest/_req-header-fmt')

/**
 * Arc <6 REST + Lambda integration (non-proxy) request formatter
 * - Mocks request object shape from API Gateway VTL
 */
module.exports = function requestFormatterDeprecated ({ method, req }) {
  let { body, headers, params, url } = req
  let { pathname: path } = URL.parse(url)
  let { query } = URL.parse(url, true)

  let { headers: normalizedHeaders } = headerFormatter(headers)
  // Early API Gateway x Lambda integrations coerce 'Cookie' from 'cookie', but not >6.x
  if (normalizedHeaders.cookie) {
    normalizedHeaders.Cookie = normalizedHeaders.cookie
    delete normalizedHeaders.cookie
  }

  let request = {
    method,
    httpMethod: method,
    path,
    body,
    headers: normalizedHeaders,
    params,
    query,
    queryStringParameters: query
  }

  return request
}

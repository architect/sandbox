let URL = require('url')
let headerFormatter = require('./_req-header-fmt')

/**
 * Arc 6+ request formatter
 * - Mocks request object shape from API Gateway / Lambda proxy integration
 */
module.exports = function requestFormatter ({ verb, route, req }) {
  let { body, params, url } = req
  let path = URL.parse(url).pathname
  let query = {}
  let multiValueQueryStringParameters = {}
  let queryData = URL.parse(url, true).query
  // API Gateway places Array-type query strings into its own property
  // located at req.multiValueQueryStringParameters.
  // This mimicks that behavior.
  for (let param of Object.keys(queryData)) {
    if (Array.isArray(queryData[param])) {
      query[param] = queryData[param][queryData[param].length - 1]
      multiValueQueryStringParameters[param] = queryData[param]
    }
    else {
      query[param] = queryData[param]
      multiValueQueryStringParameters[param] = [ queryData[param] ]
    }
  }

  let { headers, multiValueHeaders } = headerFormatter(req.headers)

  // API Gateway sends a null literal instead of an empty object because reasons
  let nullify = i => Object.getOwnPropertyNames(i).length ? i : null

  // Maybe de-interpolate path into resource
  let resource = path
  if (route && route.includes(':')) {
    resource = route.split('/')
      .map(part => part.startsWith(':')
        ? `{${part.replace(':', '')}}`
        : part)
      .join('/')
  }

  let request = {
    httpMethod: verb,
    path,
    resource,
    body: nullify(body),
    headers,
    multiValueHeaders,
    pathParameters: nullify(params),
    queryStringParameters: nullify(query),
    multiValueQueryStringParameters: nullify(multiValueQueryStringParameters),
  }

  // Base64 encoding status set by binary handler middleware
  if (req.isBase64Encoded) request.isBase64Encoded = true

  // Pass through resource param, importantly: '/' or '/{proxy+}'
  if (req.resource) request.resource = req.resource

  return request
}

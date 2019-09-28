let URL = require('url')

/**
 * Arc 6+ request formatter
 * - Mocks request object shape from API Gateway / Lambda proxy integration
 */
module.exports = function requestFormatter ({verb, route, req}) {
  let {body, headers, params, url} = req
  let path = URL.parse(url).pathname
  let query = URL.parse(url, true).query

  // API Gateway sends a null literal instead of an empty object because reasons
  let nullify = i => Object.getOwnPropertyNames(i).length ? i : null

  // Maybe de-interpolate path into resource
  let resource = path
  if (route && route.includes(':')) {
    resource = route.split('/')
      .map(part => part.startsWith(':')
        ? `{${part.replace(':','')}}`
        : part)
      .join('/')
  }

  let request = {
    httpMethod: verb,
    path,
    resource,
    body: nullify(body),
    headers,
    pathParameters: nullify(params),
    queryStringParameters: nullify(query),
  }

  // Base64 encoding status set by binary handler middleware
  if (req.isBase64Encoded) request.isBase64Encoded = true

  // Pass through resource param, importantly: '/' or '/{proxy+}'
  if (req.resource) request.resource = req.resource

  return request
}

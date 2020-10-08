let URL = require('url')
let headerFormatter = require('./_req-header-fmt')

/**
 * Arc 6+ REST API + Lambda & HTTP API + Lambda v1.0 request formatter
 * - Mocks request object shape from API Gateway <> Lambda proxy integration
 * - HTTP APIs can emulate these REST API request payloads with the Lambda 1.0 payload, but AWS didn't make it an exact match because reasons
 */
module.exports = function requestFormatter ({ method, route, req }, httpApi) {
  let { body, params, url } = req
  let path = URL.parse(url).pathname
  let query = {}
  let multiValueQueryStringParameters = {}
  let queryData = URL.parse(url, true).query
  // API Gateway places Array-type query strings into multiValueQueryStringParameters
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

  let { headers, multiValueHeaders } = headerFormatter(req.headers, httpApi)

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

  // Pass through resource param, importantly: '/' or '/{proxy+}'
  if (req.resource) resource = req.resource

  let httpMethod = req.method || method.toUpperCase()

  let request = {
    httpMethod,
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
  request.isBase64Encoded = !!(req.isBase64Encoded)

  // HTTP API + Lambda v1.0 payload
  if (httpApi) request.version = '1.0'

  // Context
  request.requestContext = {
    httpMethod,
    path,
    resourcePath: resource
  }

  return request
}

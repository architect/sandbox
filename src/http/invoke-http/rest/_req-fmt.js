let URL = require('url')
let headerFormatter = require('./_req-header-fmt')

/**
 * Arc 6+ REST API + Lambda & HTTP API + Lambda v1.0 request formatter
 * - Mocks request object shape from API Gateway <> Lambda proxy integration
 * - HTTP APIs can emulate these REST API request payloads with the Lambda 1.0 payload, but AWS didn't make it an exact match because reasons
 */
module.exports = function requestFormatter ({ method, path, req }, httpApi) {
  let { body, params, resource, url } = req
  let { pathname } = URL.parse(url)

  // Resource may be manually supplied via ASAP or greedy root
  // Otherwise rely on paths, as defined in inventory.http[route]
  resource = resource || path
  if (resource && resource.includes(':')) {
    resource = resource.split('/')
      .map(part => part.startsWith(':')
        ? `{${part.replace(':', '')}}`
        : part)
      .join('/')
  }
  // Handle catchalls
  let hasCatchall = false
  if (resource && resource.endsWith('/*')) {
    resource = resource.replace('/*', '/{proxy+}')
    hasCatchall = true
  }

  // Query string things
  let query = {}
  let multiValueQueryStringParameters = {}
  let { query: queryData } = URL.parse(url, true)
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

  // Method stuff
  let httpMethod = req.method || method.toUpperCase()

  // Here we go!
  let request = {
    httpMethod,
    path: pathname,
    resource,
    body: nullify(body),
    headers,
    multiValueHeaders,
    pathParameters: nullify(params),
    queryStringParameters: nullify(query),
    multiValueQueryStringParameters: nullify(multiValueQueryStringParameters),
    requestContext: {
      httpMethod,
      path: pathname,
      resourcePath: resource
    }
  }

  // Base64 encoding status set by binary handler middleware
  request.isBase64Encoded = !!(req.isBase64Encoded)

  // HTTP API + Lambda v1.0 payload
  if (httpApi) request.version = '1.0'

  // Path parameters
  if (httpApi && params && Object.keys(params).length) {
    // Try to work around router's '0' param jic someone actually used that
    if (hasCatchall) {
      request.pathParameters = { ...params, proxy: params['0'] }
      delete request.pathParameters['0']
    }
    else request.pathParameters = params
  }

  return request
}

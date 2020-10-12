let URL = require('url')
let headerFormatter = require('./_req-header-fmt')

/**
 * Arc 6+ HTTP + Lambda v2.0 request formatter
 * - Mocks request object shape from API Gateway <> Lambda proxy integration
 * - Unlike the REST request formatter, we build this out as we go (instead of mostly in one big lump) because params are conditionally omitted
 */
module.exports = function requestFormatter ({ method, route, req }) {
  let { body, params, resource, url } = req
  let { pathname: path, query } = URL.parse(url)

  // Here we go!
  let request = {
    version: '2.0'
  }

  // Maybe de-interpolate path into resource
  resource = resource || route
  // Handle route params
  if (route && route.includes(':')) {
    resource = route.split('/')
      .map(part => part.startsWith(':')
        ? `{${part.replace(':', '')}}`
        : part)
      .join('/')
  }
  // Handle catchalls
  if (route && route.includes('*')) {
    resource = route.split('/')
      .map(part => part === '*'
        ? `{proxy+}`
        : part)
      .join('/')
  }

  // Path things
  let routeKey = `${method.toUpperCase()} ${resource}`
  request.routeKey = routeKey
  request.rawPath = path

  // Query string things
  request.rawQueryString = query || ''
  if (request.rawQueryString) {
    let { query: queryData } = URL.parse(url, true)
    let queryStringParameters = {}
    Object.entries(queryData).forEach(([ key, value ]) => {
      queryStringParameters[key] = Array.isArray(value) ? value.join(',') : value
    })
    request.queryStringParameters = queryStringParameters
  }

  // Headers + cookies
  let { headers, cookies } = headerFormatter(req.headers)
  if (cookies) request.cookies = cookies
  request.headers = headers

  // Context, which now contains the HTTP method
  request.requestContext = {
    http: {
      method: req.method || method.toUpperCase(),
      path
    },
    routeKey
  }

  // Path parameters
  if (Object.keys(params).length) {
    request.pathParameters = route && route.endsWith('/*')
      ? { proxy: params['0'] }
      : params
  }

  // Body
  if (typeof body === 'string') {
    request.body = body
  }

  // Base64 encoding status set by binary handler middleware
  request.isBase64Encoded = !!(req.isBase64Encoded)

  return request
}

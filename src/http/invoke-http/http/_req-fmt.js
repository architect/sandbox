let URL = require('url')
let headerFormatter = require('./_req-header-fmt')

/**
 * Arc 6+ HTTP + Lambda v2.0 request formatter
 * - Mocks request object shape from API Gateway <> Lambda proxy integration
 */
module.exports = function requestFormatter ({ verb, route, req, $default }) {
  let { body, params, url } = req
  let { pathname: rawPath, query } = URL.parse(url)

  // Maybe de-interpolate path into resource
  let resource = route ? route : '/'
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

  // Here we go
  let request = {
    version: '2.0'
  }

  // Path things
  let routeKey = $default ? '$default' : `${verb.toUpperCase()} ${resource}`
  request.routeKey = routeKey
  request.rawPath = rawPath

  // Query string things
  request.rawQueryString = query || ''
  if (request.rawQueryString) {
    let { query } = URL.parse(url, true)
    let queryStringParameters = {}
    Object.entries(query).forEach(([ key, value ]) => {
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
      method: verb.toUpperCase(),
      path: rawPath
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

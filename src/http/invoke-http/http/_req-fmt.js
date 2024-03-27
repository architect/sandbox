let URL = require('url')
let headerFormatter = require('./_req-header-fmt')

/**
 * Arc 6+ HTTP + Lambda v2.0 request formatter
 * - Mocks request object shape from API Gateway <> Lambda proxy integration
 * - Unlike the REST request formatter, we build this out as we go (instead of mostly in one big lump) because params are conditionally omitted
 */
module.exports = function requestFormatter ({ method, path, req }) {
  let { body, params, resource, url } = req
  let { pathname, query } = URL.parse(url)

  // Here we go!
  let request = {
    version: '2.0',
  }

  // Resource may be manually supplied via ASAP
  // Otherwise rely on paths, as defined in inventory.http[route]
  resource = resource || path

  // Handle params
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

  // Path things
  let routeKey = `${method.toUpperCase()} ${resource}`
  request.routeKey = routeKey
  request.rawPath = pathname

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

  // Client IP address
  let ip =  req.headers?.['x-forwarded-for'] ||
            req.socket?.remoteAddress ||
            req.connection?.remoteAddress ||
            req.connection?.socket?.remoteAddress
  let sourceIp = ip?.split(':').slice(-1).join() || null // Handle IPV6 prepended formatting

  // Headers + cookies
  let { headers, cookies } = headerFormatter(req.headers, { req, ip: sourceIp })
  if (cookies) request.cookies = cookies
  request.headers = headers

  // Context, which now contains the HTTP method
  request.requestContext = {
    http: {
      method: req.method || method.toUpperCase(),
      path: pathname,
      protocol: `HTTP/${req.httpVersion}`,
      sourceIp,
      userAgent: headers['user-agent'] || null,
    },
    // requestId // TODO add me maybe
    routeKey,
    timeEpoch: Math.floor(Date.now() / 1000),
  }

  // Path parameters
  if (Object.keys(params).length) {
    // Try to work around router's '0' param jic someone actually used that
    if (hasCatchall) {
      request.pathParameters = { ...params, proxy: params['0'] }
      delete request.pathParameters['0']
    }
    else request.pathParameters = params
  }

  // Body
  if (typeof body === 'string') {
    request.body = body
  }

  // Base64 encoding status set by binary handler middleware
  request.isBase64Encoded = !!(req.isBase64Encoded)

  return request
}

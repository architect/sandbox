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

  // Client IP address
  let ip =  req.headers?.['x-forwarded-for'] ||
            req.headers?.['X-Forwarded-For'] ||
            req.socket?.remoteAddress ||
            req.connection?.remoteAddress ||
            req.connection?.socket?.remoteAddress
  let sourceIp = ip?.split(':').slice(-1).join() || null // Handle IPV6 prepended formatting

  let { headers, multiValueHeaders } = headerFormatter(req.headers, httpApi, { req, ip: sourceIp })

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
      resourcePath: resource,
      protocol: `HTTP/${req.httpVersion}`,
      identity: {
        sourceIp,
        userAgent: headers['User-Agent'] || headers['user-agent'] || null,
      },
    },
  }

  // Base64 encoding status set by binary handler middleware
  request.isBase64Encoded = !!(req.isBase64Encoded)

  // HTTP API + Lambda v1.0 payload
  if (httpApi) request.version = '1.0'

  // Path parameters
  if (httpApi && params && Object.keys(params).length) {
    if (hasCatchall) {
      // Router 2 no longer supports bare wildcards (`/*`), wildcards must now be "named", so they're now found at `/*_arc_catchall` (which returns an `_arc_catchall` property)
      let proxy = params['_arc_catchall'].join('/')
      request.pathParameters = { ...params, proxy }
      delete request.pathParameters['_arc_catchall']
    }
    else request.pathParameters = params
    // Router 2 also no longer catches trailing slashes at the trailing wildcard level, so we have to work around that as well
    // However, REST APIs have not been supported in Arc for years now, so I am not doing the work to figure out if this behavior needs to be replicated
  }

  return request
}

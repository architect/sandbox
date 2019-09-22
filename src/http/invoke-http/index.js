let url = require('url')
let invoke = require('../invoke-lambda')

/**
 * builds response middleware for invoke
 */
module.exports = function invokeHTTP({verb, pathToFunction, route}) {
  if (verb) verb = verb.toUpperCase()

  return function respond(req, res) {

    // HACK api gateway 'Cookie' from express 'cookie'
    req.headers.Cookie = req.headers.cookie
    delete req.headers.cookie
    if (!req.headers.Cookie) delete req.headers.Cookie

    let nullify = i => Object.getOwnPropertyNames(i).length ? i : null

    let path = url.parse(req.url).pathname
    let body = req.body
    let headers = req.headers
    let params = req.params
    let query = url.parse(req.url, true).query
    let deprecated = process.env.DEPRECATED

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
    if (req.isBase64Encoded && !deprecated) request.isBase64Encoded = true

    if (deprecated) {
      request = {
        method: verb,
        httpMethod: verb,
        path,
        body,
        headers,
        params,
        query,
        queryStringParameters: query
      }
    }

    // Mock /{proxy+} resource key
    if (req.resource && !deprecated) request.resource = req.resource

    // run the lambda sig locally
    invoke(pathToFunction, request, function _res(err, result) {
      if (err) res(err)
      else {
        // HTTP status
        res.setHeader('Content-Type', result.type || 'application/json; charset=utf-8')
        res.statusCode = result.status || result.code || result.statusCode || 200

        // Cookie
        //   remove Secure because localhost won't be SSL (and the cookie won't get set)
        if (result.cookie)
          res.setHeader('Set-Cookie', result.cookie.replace('; Secure', '; Path=/'))

        // Location
        if (result.location)
          res.setHeader('Location', result.location)

        // Cross-origin ritual sacrifice
        if (result.cors)
          res.setHeader('Access-Control-Allow-Origin', '*')

        // Cache-Control
        if (result.cacheControl)
          res.setHeader('Cache-Control', result.cacheControl)

        // Headers
        if (result.headers) {
          Object.keys(result.headers).forEach(k=> {
            if (k.toLowerCase() === 'set-cookie' && result.headers[k]) {
              res.setHeader(k, result.headers[k].replace('; Secure', '; Path=/'))
            } else if (k === 'cache-control' && result.headers[k]) {
              res.setHeader('Cache-Control', result.headers[k])
              res.removeHeader('cache-control')
            } else {
              res.setHeader(k, result.headers[k])
            }
          })
        }

        // Set default anti-caching headers
        let antiCache = res.getHeader('Content-Type') &&
                        res.getHeader('Content-Type').includes('text/html') ||
                        res.getHeader('Content-Type').includes('application/json')
        if (!result.cacheControl && antiCache) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0')
        }
        else if (!result.cacheControl) {
          res.setHeader('Cache-Control', 'max-age=86400') // Default cache to one day unless otherwise specified
        }

        /**
         * Body handling
         */
        // Reject raw, unencoded buffers (as does APIG)
        let isBuffer = () => {
          let body = result.body
          if (body && body instanceof Buffer) return true
          if (body && body.type && body.type === 'Buffer' && body.data instanceof Array) return true
          return false
        }
        if (isBuffer() && !deprecated) {
          res.statusCode = 502
          res.removeHeader('Content-Type')
          result.body =
`Cannot respond with a raw buffer.

Please base64 encode your response and include a 'isBase64Encoded: true' parameter, or run your response through @architect/functions`
        }

        /**
         * Arc v5 proxy binary responses
         * - Selective encoding pattern based on path:
         *   - /{proxy+} (possibly also paired with arc.proxy()) can emit binary responses via base64-encoded body + isBase64Encoded: true
         *   - Specified doc types convert to strings
         */
        let base64EncodedBody = result.isBase64Encoded &&
                                result.body &&
                                typeof result.body === 'string'
        if (base64EncodedBody && deprecated) {
          // Doc types defined in Arc v5 for conversion
          //   all other doc types
          let documents = [
            'application/javascript',
            'application/json',
            'text/css',
            'text/html',
            'text/javascript',
            'text/plain',
            'text/xml'
          ]
          // Check to see if it's a known-supported doc without assuming normalized header casing
          // Gross but it works
          let isText = documents.some(d => {
            let match =
              res.getHeader('Content-Type') &&
              res.getHeader('Content-Type').includes(d) ||
              result.type && result.type.includes(d)
            return match
          })
          if (isText) // It's an encoded string
            result.body = Buffer.from(result.body, 'base64').toString()
          else // It's a binary
            result.body = Buffer.from(result.body, 'base64')
        }
        /**
         * Arc v6 endpoint binary responses
         * - Any endpoint can emit binary responses via base64-encoded body + isBase64Encoded: true
         */
        if (base64EncodedBody && !deprecated)
          result.body = Buffer.from(result.body, 'base64')

        // isBase64Encoded flag passthrough
        if (result.isBase64Encoded)
          res.isBase64Encoded = true

        // Re-encode nested JSON responses
        if (typeof result.json !== 'undefined') {
          // CYA in case we receive an object instead of encoded JSON
          try {
            let body = result.body // noop the try
            // Real JSON will create an object
            let maybeRealJSON = JSON.parse(result.body)
            if (typeof maybeRealJSON !== 'object')
              result.body = body
          }
          catch (e) {
            // JSON-parsing an object will fail, so JSON stringify it
            result.body = JSON.stringify(result.body)
          }
        }

        res.end(result.body || '')
      }
    })
  }
}

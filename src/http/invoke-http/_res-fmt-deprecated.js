let headerFormatter = require('./_res-header-fmt')

/**
 * Arc <6 response formatter
 * - Mocks response object shape for API Gateway VTL
 */
module.exports = function responseFormatterDeprecated ({ res, result }) {
  // HTTP status
  res.statusCode = result.status || result.code || result.statusCode || 200

  // VTL-based parameters
  let { cacheControl, cookie, cors, headers, location, type } = result

  // Content type
  // Note: result.headers is a case-sensitive js object,
  //       res.get/setHeader is not (e.g. 'set-cookie' == 'Set-Cookie')
  let contentType = type ||
                    (headers && headers['Content-Type']) ||
                    (headers && headers['content-type'])
  res.setHeader('Content-Type', contentType || 'application/json; charset=utf-8')
  if (headers && headers['content-type']) delete headers['content-type']

  // Cookie
  //   remove Secure because localhost won't be SSL (and the cookie won't get set)
  if (cookie) {
    res.setHeader('Set-Cookie', cookie.replace('; Secure', '; Path=/'))
  }

  // Location
  if (location) {
    res.setHeader('Location', location)
  }

  // Cross-origin ritual sacrifice
  if (cors) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }

  // Cache-Control
  if (cacheControl) {
    res.setHeader('Cache-Control', cacheControl)
  }

  // Headers
  if (headers) {
    // Apply all that funky stuff AWS loves doing to our headers
    headers = headerFormatter(headers)

    Object.keys(headers).forEach(k => {
      if (k === 'set-cookie') {
        res.setHeader(k, headers[k].replace('; Secure', '; Path=/'))
      }
      else if (k === 'cache-control') {
        res.setHeader('Cache-Control', headers[k])
      }
      else {
        res.setHeader(k, headers[k])
      }
    })
  }

  // Set default anti-caching headers
  let antiCache = contentType &&
                  (contentType.includes('text/html') || contentType.includes('application/json'))
  if (!result.cacheControl && antiCache) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0')
  }
  else if (!result.cacheControl && !res.getHeader('Cache-Control')) {
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
  if (isBuffer()) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'text/html; charset=utf-8;')
    result.body = `Cannot respond with a raw buffer.

Please base64 encode your response and include a 'isBase64Encoded: true' parameter, or run your response through @architect/functions`
    return result.body
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
  if (base64EncodedBody) {
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

  // isBase64Encoded flag passthrough
  if (result.isBase64Encoded) {
    res.isBase64Encoded = true
  }

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

  return result.body
}

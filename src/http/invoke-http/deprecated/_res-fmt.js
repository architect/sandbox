let headerFormatter = require('../rest/_res-header-fmt')

/**
 * Arc <6 response formatter
 * - Mocks response object shape for API Gateway VTL
 */
module.exports = function responseFormatterDeprecated ({ res, result }) {
  // HTTP status
  let { status, code, statusCode } = result
  res.statusCode = status || code || statusCode || 200

  // VTL-based parameters
  let { body, cacheControl, cookie, cors, headers, location, type, isBase64Encoded } = result

  // Content type
  // Note: result.headers is a case-sensitive js object,
  //       res.get/setHeader is not (e.g. 'set-cookie' == 'Set-Cookie')
  let contentType = type ||
                    (headers && headers['Content-Type']) ||
                    (headers && headers['content-type']) ||
                    'application/json; charset=utf-8'
  res.setHeader('Content-Type', contentType)
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
  if (!cacheControl && antiCache) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0')
  }
  else if (!cacheControl && !res.getHeader('Cache-Control')) {
    res.setHeader('Cache-Control', 'max-age=86400') // Default cache to one day unless otherwise specified
  }

  /**
   * Arc v5 proxy binary responses
   * - Selective encoding pattern based on path:
   *   - /{proxy+} (possibly also paired with arc.proxy()) can emit binary responses via base64-encoded body + isBase64Encoded: true
   *   - Specified doc types convert to strings
   */
  let base64EncodedBody = isBase64Encoded && body && typeof body === 'string'
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
      return contentType.includes(d) || (type && type.includes(d))
    })
    if (isText) // It's an encoded string
      body = Buffer.from(body, 'base64').toString()
    else // It's a binary
      body = Buffer.from(body, 'base64')
  }

  // isBase64Encoded flag passthrough
  if (isBase64Encoded) {
    res.isBase64Encoded = true
  }

  return body
}

/**
 * Arc 6+ response formatter
 * - Mocks response object shape for API Gateway / Lambda proxy integration
 */
module.exports = function responseFormatter ({res, result}) {
  // HTTP status
  res.statusCode = result.statusCode || 200

  // Content type
  // Note: result.headers is a case-sensitive js object,
  //       res.get/setHeader is not (e.g. 'set-cookie' == 'Set-Cookie')
  let contentType = result && result.headers && result.headers['Content-Type'] ||
                    result && result.headers && result.headers['content-type']
  res.setHeader('Content-Type', contentType || 'application/json; charset=utf-8')
  if (result.headers && result.headers['content-type']) delete result.headers['content-type']

  // Headers
  if (result.headers) {
    Object.keys(result.headers).forEach(k=> {
      if (k.toLowerCase() === 'set-cookie' && result.headers[k]) {
        res.setHeader(k, result.headers[k].replace('; Secure', '; Path=/'))
      } else if (k === 'cache-control' && result.headers[k]) {
        res.setHeader('Cache-Control', result.headers[k])
      } else {
        res.setHeader(k, result.headers[k])
      }
    })
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
   * Arc v6 endpoint binary responses
   * - Any endpoint can emit binary responses via base64-encoded body + isBase64Encoded: true
   */
  let base64EncodedBody = result.isBase64Encoded &&
                          result.body &&
                          typeof result.body === 'string'
  if (base64EncodedBody)
    result.body = Buffer.from(result.body, 'base64')

  // isBase64Encoded flag passthrough
  if (result.isBase64Encoded)
    res.isBase64Encoded = true

  return result.body
}

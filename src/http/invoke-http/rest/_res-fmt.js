let headerFormatter = require('./_res-header-fmt')

/**
 * Arc 6+ response formatter
 * - Mocks response object shape for API Gateway / Lambda proxy integration
 */
module.exports = function responseFormatter ({ res, result }) {
  // HTTP status
  res.statusCode = result.statusCode || 200

  // Content type
  // Note: result.headers is a case-sensitive js object,
  //       res.get/setHeader is not (e.g. 'set-cookie' == 'Set-Cookie')
  let { headers, multiValueHeaders } = result
  let contentType = (multiValueHeaders && multiValueHeaders['Content-Type']) ||
                    (multiValueHeaders && multiValueHeaders['content-type']) ||
                    (headers && headers['Content-Type']) ||
                    (headers && headers['content-type'])
  // Set content-type, and remove any leftover versions of content-type
  res.setHeader('content-type', contentType || 'application/json; charset=utf-8')
  let allHeaders = [ multiValueHeaders || {}, headers || {} ]
  allHeaders.forEach(headers => {
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase() !== 'content-type') return
      delete headers[key]
    })
  })

  // Headers
  let hasHeaders = multiValueHeaders || headers
  if (hasHeaders) {
    // APIG merges `headers` and `multiValueHeaders` if both are set, favoring multiValue first
    if (multiValueHeaders && headers) {
      headers = Object.entries(headers).reduce((accumulator, [ key, value ]) => {
        return { ...accumulator, [key]: [ ...(multiValueHeaders[key] || []), value ] }
      }, headers)
    }

    // Apply all that funky stuff AWS loves doing to our headers
    headers = headerFormatter(headers)

    Object.keys(headers).forEach(k => {
      if (k === 'set-cookie') {
        if (!Array.isArray(headers[k]))
          res.setHeader(k, headers[k].replace('; Secure', '; Path=/'))
        else {
          res.setHeader(k, headers[k].map(value => value.replace('; Secure', '; Path=/')))
        }
      }
      else if (k === 'cache-control') {
        res.setHeader('cache-control', headers[k])
      }
      else {
        res.setHeader(k, headers[k])
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
    res.setHeader('content-type', 'text/html; charset=utf-8;')
    result.body = `Cannot respond with a raw buffer.

Please base64 encode your response and include a 'isBase64Encoded: true' parameter, or run your response through @architect/functions`
    return result.body
  }

  /**
   * Arc v6 endpoint binary responses
   * - Any endpoint can emit binary responses via base64-encoded body + isBase64Encoded: true
   */
  let base64EncodedBody = result.isBase64Encoded &&
                          (result.body && typeof result.body === 'string')
  if (base64EncodedBody) {
    result.body = Buffer.from(result.body, 'base64')
  }

  // isBase64Encoded flag passthrough
  if (result.isBase64Encoded) {
    res.isBase64Encoded = true
  }

  return result.body
}

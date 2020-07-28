let headerFormatter = require('./_res-header-fmt')

/**
 * Arc 6+ REST API + Lambda & HTTP API + Lambda v1.0 response formatter
 * - Mocks response object shape for API Gateway / Lambda proxy integration
 */
module.exports = function responseFormatter ({ res, result }) {
  let { body, headers, multiValueHeaders, statusCode, isBase64Encoded } = result

  // HTTP status
  res.statusCode = statusCode || 200

  // Content type
  // Note: result.headers is a case-sensitive js object,
  //       res.get/setHeader is not (e.g. 'set-cookie' == 'Set-Cookie')
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
   * Arc v6 endpoint binary responses
   * - Any endpoint can emit binary responses via base64-encoded body + isBase64Encoded: true
   */
  let base64EncodedBody = isBase64Encoded && (body && typeof body === 'string')
  if (base64EncodedBody) {
    body = Buffer.from(body, 'base64')
  }

  // isBase64Encoded flag passthrough
  if (isBase64Encoded) {
    res.isBase64Encoded = true
  }

  return body
}

let headerFormatter = require('./_res-header-fmt')

/**
 * Arc 6+ REST API + Lambda & HTTP API + Lambda v1.0 response formatter
 * - Mocks response object shape for API Gateway / Lambda proxy integration
 */
module.exports = function responseFormatter ({ res, result }) {
  let { body, headers, multiValueHeaders, statusCode, isBase64Encoded } = result

  // HTTP status
  res.statusCode = statusCode || 200

  // Headers
  // APIG merges `headers` and `multiValueHeaders`, favoring multiValue first
  let merged = {}
  if (multiValueHeaders) {
    Object.entries(multiValueHeaders).forEach(([ header, value ]) => {
      merged[header.toLowerCase()] = value
    })
  }
  if (headers) {
    Object.entries(headers).forEach(([ h, value ]) => {
      let header = h.toLowerCase()
      if (merged[header]) {
        // Don't set the same header multiple times
        if (!merged[header].includes(value)) {
          merged[header].push(value)
        }
      }
      else merged[header] = [ value ]
    })
  }

  // Content type
  let contentType = multiValueHeaders?.['content-type'] ||
                    multiValueHeaders?.['Content-Type'] ||
                    headers?.['content-type'] ||
                    headers?.['Content-Type'] ||
                    'application/json; charset=utf-8'
  merged['content-type'] = merged['content-type']
    ? [ merged['content-type'][0] ]
    : contentType

  // Apply all that funky stuff AWS loves doing to our headers
  headers = headerFormatter(merged)

  Object.entries(headers).forEach(([ header, value ]) => {
    // If possible, coerce string from array – makes test validation easier
    if (value.length === 1) value = value[0]
    if (header === 'set-cookie') {
      let val = Array.isArray(value)
        ? value.map(value => value.replace('; Secure', '; Path=/'))
        : value.replace('; Secure', '; Path=/')
      res.setHeader(header, val)
    }
    else {
      res.setHeader(header, value)
    }
  })

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

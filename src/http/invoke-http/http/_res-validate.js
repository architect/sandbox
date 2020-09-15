let { isBuffer, errors, invalid } = require('../utils/validate')

/**
 * Arc 6+ HTTP API + Lambda v2.0 response validator
 */
module.exports = function responseValidator ({ res, result }) {
  // Somehow HTTP APIs don't care if nothing is returned
  if (!result) return { valid: true }

  let { statusCode, body, headers, cookies, isBase64Encoded } = result

  // Basic type checking
  if (statusCode && !Number.isInteger(statusCode)) {
    let body = errors.invalidType('statusCode', 'Number')
    return invalid(res, body)
  }
  if (statusCode && isBuffer(body)) {
    // Reject raw, unencoded buffers (as does APIG), but only if a statusCode is provided
    let body = errors.isRawBuffer
    return invalid(res, body)
  }
  if (statusCode && body && typeof body !== 'string') {
    // Only enforce body checks if statusCode is provided
    let body = errors.invalidType('body', 'String')
    return invalid(res, body)
  }
  if (headers && (typeof headers !== 'object' || Array.isArray(headers))) {
    let body = errors.invalidType('headers', 'Object')
    return invalid(res, body)
  }
  if (cookies && !Array.isArray(cookies)) {
    let body = errors.invalidType('cookies', 'array')
    return invalid(res, body)
  }
  if (typeof isBase64Encoded !== 'undefined' && typeof isBase64Encoded !== 'boolean') {
    let body = errors.invalidType('isBase64Encoded', 'Boolean')
    return invalid(res, body)
  }

  // Old school Arc v5 style: accept any params!
  return { valid: true }
}

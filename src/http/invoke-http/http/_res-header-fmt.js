/**
 * Accepts normalized headers from app output and does final AWS-like sanitization
 * - This formatter follows *actually observed* API Gateway behavior
 * - What's published in the API Gateway docs (link below) has been known to differ
 * - See: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
 */
module.exports = function responseHeaderFormatter (normalizedHeaders) {
  if (!normalizedHeaders) return

  let headers = {}
  let drops = [
    'connection',
    'content-length',
    'date',
    'upgrade',
    'transfer-encoding'
  ]

  for (let [ key, value ] of Object.entries(normalizedHeaders)) {
    key = key.toLowerCase()
    if (drops.includes(key)) continue
    else headers[key] = value
  }

  return headers
}

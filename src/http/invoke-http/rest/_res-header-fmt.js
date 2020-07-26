/**
 * Accepts normalized headers from app output and does final AWS-like sanitization and remapping
 * - This formatter follows *actually observed* API Gateway behavior
 * - What's published in the API Gateway docs (link below) has been known to differ
 * - See: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
 */
module.exports = function responseHeaderFormatter (normalizedHeaders) {
  let headers = {}
  let remapped = [
    'authorization',
    'connection',
    'content-length',
    'content-md5',
    'date',
    'expect',
    'host',
    'max-forwards',
    'proxy-authenticate',
    'server',
    'trailer',
    'upgrade',
    'user-agent',
    'www-authenticate',
  ]
  let drops = [
    'transfer-encoding'
  ]

  for (let [ key, value ] of Object.entries(normalizedHeaders)) {
    key = key.toLowerCase()
    if (drops.some(d => d === key)) continue
    if (remapped.some(r => r === key)) {
      let remappedName = `x-amzn-remapped-${key}`
      headers[remappedName] = value
    }
    else {
      headers[key] = value
    }
  }

  return headers
}

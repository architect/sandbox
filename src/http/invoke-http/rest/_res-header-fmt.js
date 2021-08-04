/**
 * Accepts normalized headers from app output and does final AWS-like sanitization and remapping
 * - This formatter follows *actually observed* API Gateway behavior
 * - What's published in the API Gateway docs (link below) has been known to differ
 * - See: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
 */
module.exports = function responseHeaderFormatter (normalizedHeaders, httpApi) {
  let headers = {}
  let drops = [
    'upgrade', // Technically not dropped, but header is validated by APIG and impl can cause HTTP issues, so we'll sidestep in Sandbox
    'transfer-encoding'
  ]

  if (httpApi) {
    drops.push('connection')
    for (let [ key, value ] of Object.entries(normalizedHeaders)) {
      key = key.toLowerCase()
      if (drops.includes(key)) continue
      headers[key] = value
    }
  }
  else {
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
      'user-agent',
      'www-authenticate',
    ]

    for (let [ key, value ] of Object.entries(normalizedHeaders)) {
      key = key.toLowerCase()
      if (drops.includes(key)) continue
      if (remapped.includes(key)) {
        let remappedName = `x-amzn-remapped-${key}`
        headers[remappedName] = value
      }
      else headers[key] = value
    }
  }

  return headers
}

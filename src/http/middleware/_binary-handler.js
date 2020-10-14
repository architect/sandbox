/**
 * Emulates our API Gateway binary → base64 handling
 */
module.exports = function binary (req, res, next) {
  let deprecated = process.env.DEPRECATED
  let apiType = process.env.ARC_API_TYPE
  let { headers } = req

  function isJson () {
    let json = /^application\/.*json/
    return json.test(headers['content-type'])
  }

  function isBinary () {
    let binaryTypes = /^application\/octet-stream/
    let multipartFormData = /^multipart\/form-data/
    return binaryTypes.test(headers['content-type']) ||
           multipartFormData.test(headers['content-type']) ||
           false
  }

  let contentLength = headers && headers['content-length']
  let isWebSocket = req.url === '/__arc'
  if (!contentLength || Number(contentLength) === 0) {
    req.body = {}
    next()
  }
  else if (isWebSocket) {
    next()
  }
  else if (!deprecated || isBinary()) {
    let body = []
    req.on('data', chunk => {
      body.push(chunk)
      req.resume()
    })
    req.on('end', () => {
      // Arc v6 HTTP APIs keep JSON as strings, but otherwise base64-encode everything
      if (!deprecated && apiType === 'http' && isJson()) {
        req.body = Buffer.concat(body).toString()
        req.isBase64Encoded = false
      }
      else {
        // Arc v6 REST APIs base64-encode everything
        // Arc v5 REST APIs base64-encode only binary payloads
        let base64 = Buffer.concat(body).toString('base64')
        // Fallback to empty object (emulates `body-parser`)
        req.body = deprecated
          ? base64 ? { base64 } : {}
          : base64 || {}
        // isBase64Encoded was introduced with Lambda proxy integrations in v6
        if (!deprecated && base64) {
          req.isBase64Encoded = true
        }
      }
      next()
    })
  }
  else {
    next()
  }
}

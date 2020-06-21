/**
 * Emulates our API Gateway binary → base64 handling
 */
module.exports = function binary (req, res, next) {
  function isBinary (headers) {
    let binaryTypes = /^application\/octet-stream/
    let multipartFormData = /^multipart\/form-data/
    if (binaryTypes.test(headers['content-type'])) return true
    if (multipartFormData.test(headers['content-type'])) return true
    return false
  }

  let contentLength = req.headers && req.headers['content-length']
  let isWebSocket = req.url === '/__arc'
  if (!contentLength || Number(contentLength) === 0) {
    req.body = {}
    next()
  }
  else if (isWebSocket) {
    next()
  }
  // Arc 6-only impl: always base64-encode all bodies
  else if (isBinary(req.headers) || !process.env.DEPRECATED) {
    let body = []
    req.on('data', chunk => {
      body.push(chunk)
      req.resume()
    })
    req.on('end', () => {
      let base64 = Buffer.concat(body).toString('base64')
      // Fallback to empty object (emulates `body-parser`)
      req.body = process.env.DEPRECATED
        ? base64 ? { base64 } : {}
        : base64 || {}
      if (!process.env.DEPRECATED && base64)
        req.isBase64Encoded = true
      next()
    })
  }
  else {
    next()
  }
}

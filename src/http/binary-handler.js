/**
 * Emaultes our API Gateway binary → base64 handling
 */
module.exports = function binary(req, res, next) {
  function isBinary(headers) {
    let binaryTypes = /^application\/octet-stream/
    let multipartFormData = /^multipart\/form-data/
    if (binaryTypes.test(headers['content-type'])) return true
    if (multipartFormData.test(headers['content-type'])) return true
    return false
  }

  if (isBinary(req.headers) || process.env.ARC_CFN) {
    let body = []
    req.on('data', chunk => {
      body.push(chunk)
      req.resume()
    })
    req.on('end', () => {
      let base64 = Buffer.concat(body).toString('base64')
      req.body = process.env.ARC_CFN
        ? base64 || {}
        : { base64 } || {}
      if (process.env.ARC_CFN) req.isBase64Encoded = true
      next()
    })
  }
  else {
    next()
  }
}
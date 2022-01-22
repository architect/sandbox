/**
 * Emulates our API Gateway binary → base64 handling
 */
module.exports = function binary ({ apiType }, req, res, next) {
  let { headers } = req

  function isJson () {
    let json = /^application\/.*json/
    return json.test(headers['content-type'])
  }

  let contentLength = headers?.['content-length']
  if (!contentLength || Number(contentLength) === 0) {
    req.body = {}
    next()
  }
  else {
    let body = []
    req.on('data', chunk => {
      body.push(chunk)
      req.resume()
    })
    req.on('end', () => {
      // Arc v6+ HTTP APIs keep JSON as strings, but otherwise base64-encode everything
      if (apiType === 'http' && isJson()) {
        req.body = Buffer.concat(body).toString()
        req.isBase64Encoded = false
      }
      else {
        // Arc v6+ REST APIs base64-encode everything
        let base64 = Buffer.concat(body).toString('base64')
        // Fallback to empty object (emulates `body-parser`)
        req.body = base64 || {}
        // isBase64Encoded was introduced with Lambda proxy integrations in v6
        if (base64) {
          req.isBase64Encoded = true
        }
      }
      next()
    })
  }
}

/**
 * API Gateway sometimes drops or mangles headers
 * - See: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
 *   - TODO: write a script to scrape this page every once in a while I guess
 */
module.exports = function requestHeaderFormatter (reqHeaders = {}) {
  let headers = {}
  let cookies

  /**
   * HTTP API + Lambda v2.0 payload mutates headers by lowcasing everything and lifting cookies out into their own param
   */
  Object.keys(reqHeaders).forEach(header => {
    let h = header.toLowerCase()
    if (h === 'cookie') {
      cookies = reqHeaders[header]
    }
    else headers[h] = reqHeaders[header]
  })

  /**
   * Put that cookie down! Now!
   */
  if (cookies) {
    cookies = cookies.split(';').map(c => c.trim())
  }

  /**
   * Sometimes AWS drops headers because reasons
   */
  let drops = [
    'connection',
    'expect',
    'proxy-authenticate',
    'te',
    'transfer-encoding',
    'upgrade',
  ]
  Object.keys(reqHeaders).forEach(header => {
    let h = header.toLowerCase()
    if (drops.includes(h)) {
      delete headers[header]
    }
  })

  return { headers, cookies }
}

/**
 * AWS sometimes drops or mangles HTTP headers
 * - See: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
 *   - TODO: write a script to scrape this page every once in a while I guess
 */
module.exports = function requestHeaderFormatter (reqHeaders = {}) {
  let headers = {}
  let multiValueHeaders = {}

  /**
   * Manglings: for whatever reason Authorization, Date, Host, and User-Agent are force-Pascal-kebab-cased
   * No, this isn't documented.
   */
  Object.keys(reqHeaders).forEach(header => {
    let h = header.toLowerCase()
    if (h === 'authorization') {
      headers.Authorization = reqHeaders[header]
    }
    else if (h === 'host') {
      headers.Host = reqHeaders[header]
    }
    else if (h === 'user-agent') {
      headers['User-Agent'] = reqHeaders[header]
    }
    else if (h === 'date') {
      headers.Date = reqHeaders[header]
    }
    else headers[header] = reqHeaders[header]
  })

  /**
   * Drops: sometimes AWS drops headers because reasons
   */
  Object.keys(reqHeaders).forEach(header => {
    let h = header.toLowerCase()
    let drops = [
      'connection',
      'content-md5',
      'expect',
      'max-forwards',
      'proxy-authenticate',
      'server',
      'te',
      'trailer',
      'transfer-encoding',
      'upgrade',
      'www-authenticate',
    ]
    if (drops.includes(h)) {
      delete headers[header]
    }
  })

  /**
   * multiValueHeaders impl: it's the same, but different
   */
  Object.keys(headers).forEach(header => {
    multiValueHeaders[header] = [ headers[header] ]
  })

  return { headers, multiValueHeaders }
}

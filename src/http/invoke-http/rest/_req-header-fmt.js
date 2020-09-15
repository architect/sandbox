/**
 * API Gateway sometimes drops or mangles headers
 * - See: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
 *   - TODO: write a script to scrape this page every once in a while I guess
 * - Funny story: HTTP APIs include emulation of REST API header mangling and deletion
 *   - But wouldn't you know it: HTTP emulation of REST APIs isn't actually exactly the same because reasons (surprisedpikachu)
 */
module.exports = function requestHeaderFormatter (reqHeaders = {}, httpApi) {
  let headers = {}
  let multiValueHeaders = {}

  /**
   * Manglings: for whatever reason Authorization, Date, Host, and User-Agent are force-Pascal-kebab-cased
   * Everything else is force-lowercased
   * No, this isn't documented.
   */
  Object.keys(reqHeaders).forEach(header => {
    let h = header.toLowerCase()
    if (h === 'authorization' && !httpApi) {
      headers.Authorization = reqHeaders[header]
    }
    else if (h === 'host') {
      headers.Host = reqHeaders[header]
    }
    else if (h === 'user-agent') {
      headers['User-Agent'] = reqHeaders[header]
    }
    else if (h === 'date' && !httpApi) {
      headers.Date = reqHeaders[header]
    }
    else headers[h] = reqHeaders[header]
  })

  /**
   * Sometimes AWS drops headers because reasons
   */
  // These headers are dropped in REST APIs & HTTP APIs + Lambda 1.0 payload
  let drops = [
    'connection',
    'expect',
    'proxy-authenticate',
    'te',
    'transfer-encoding',
    'upgrade',
  ]
  // These headers are only dropped in REST APIs
  let restDrops = [
    'content-md5',
    'max-forwards',
    'server',
    'trailer',
    'www-authenticate',
  ]
  if (!httpApi) {
    drops = drops.concat(restDrops)
  }
  Object.keys(reqHeaders).forEach(header => {
    let h = header.toLowerCase()
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

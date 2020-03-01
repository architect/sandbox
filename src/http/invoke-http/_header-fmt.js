/**
 * AWS drops and sometimes mangles HTTP headers
 * - See: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
 *   - TODO: write a script against this page I guess
 */
module.exports = function headerFormatter(reqHeaders={}) {
  let headers = {}
  let multiValueHeaders = {}

  /**
   * Manglings: for whatever reason Authorization, Host, User-Agent, & Date are force-Pascal-cased
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
   * Drops: sometimes AWS drops headers
   */
  Object.keys(reqHeaders).forEach(header => {
    let h = header.toLowerCase()
    let drops = [
      'content-md5',
      'expect',
      'max-forwards',
      'proxy-authenticate',
      'server',
      'te',
      'transfer-encoding',
      'trailer',
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
    multiValueHeaders[header] = [headers[header]]
  })

  return {headers, multiValueHeaders}
}

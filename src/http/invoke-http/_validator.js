/**
 * Arc response validator
 * - Mocks API Gateway response object validation
 */
function setError (res) {
  res.statusCode = 502
  res.setHeader('Content-Type', 'text/html; charset=utf-8;')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0')
}

let errors = {
  invalidParam: `<h1>Invalid response parameter</h1>
<p>Only the following parameters are valid responses: $VALIDPARAMS</p>`,
  isRawBuffer: `<h1>Cannot respond with a raw buffer</h1>
<p>Please base64 encode your response and include a <code>isBase64Encoded: true</code> parameter, or run your response through <code>@architect/functions</code><p>`
}
let invalidParam = validParams => errors.invalidParam.replace('$VALIDPARAMS', `${validParams.map(p => `<code>${p}</code>`).join(', ')}`)

module.exports = function responseValidator ({res, result}) {
  let params = Object.getOwnPropertyNames(result)
  let deprecated = process.env.DEPRECATED
  let validParams = [
    'statusCode',
    'body',
    'headers',
    'isBase64Encoded'
  ]
  let isBuffer = () => {
    let body = result.body
    if (body && body instanceof Buffer) return true
    if (body && body.type && body.type === 'Buffer' && body.data instanceof Array) return true
    return false
  }

  // Reject raw, unencoded buffers (as does APIG)
  if (isBuffer()) {
    setError(res)
    let body = errors.isRawBuffer
    return {
      valid: false,
      body
    }
  }
  else if (!deprecated) {
    let invalid = params.some(p => !validParams.includes(p))
    if (invalid) {
      setError(res)
      let body = invalidParam(validParams)
      return {
        valid: false,
        body
      }
    }
    else return {valid: true}
  }
  else {
    let deprecatedValid = [
      // Status
      'code',
      'status',
      // Sessions
      'cookie',
      'session',
      // Headers
      'location',
      'cors',
      'type',
      'cacheControl',
      // Content types
      'css',
      'html',
      'js',
      'json',
      'text',
      'xml'
    ]
    validParams = validParams.concat(deprecatedValid)
    let invalid = params.some(p => !validParams.includes(p))
    if (invalid) {
      setError(res)
      let body = invalidParam(validParams)
      return {
        valid: false,
        body
      }
    }
    else return {valid: true}
  }
}

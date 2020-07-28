/**
 * Shared response validation utils
 */

let isBuffer = body => {
  let deprecated = process.env.DEPRECATED
  if (body && body instanceof Buffer) return true
  if (deprecated && body && body.type && body.type === 'Buffer' && body.data instanceof Array) return true
  return false
}

let errors = {
  invalidType: (param, type) => `<h1>Invalid response type</h1>
<p><code>${param}</code> parameters must be <code>${type}</code></p>`,
  invalidParam: validParams => `<h1>Invalid response parameter</h1>
<p>Only the following parameters are valid in a response: ${validParams.map(p => `<code>${p}</code>`).join(', ')}</p>`,
  isRawBuffer: `<h1>Cannot respond with a raw buffer</h1>
<p>Please base64 encode your response and include a <code>isBase64Encoded: true</code> parameter, or run your response through <code>@architect/functions</code><p>`
}

function invalid (res, body) {
  res.statusCode = 502
  res.setHeader('Content-Type', 'text/html; charset=utf-8;')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0')
  return {
    valid: false,
    body
  }
}

module.exports = {
  isBuffer,
  errors,
  invalid
}

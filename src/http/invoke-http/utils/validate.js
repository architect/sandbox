/**
 * Shared response validation utils
 */

let isBuffer = body => {
  if (body && body instanceof Buffer) return true
  return false
}

let errors = {
  invalidType: (param, type) => `<h1>Invalid response type</h1>
<p><code>${param}</code> parameters must be <code>${type}</code></p>`,
  invalidParam: validParams => `<h1>Invalid response parameter</h1>
<p>Only the following parameters are valid in a response: ${validParams.map(p => `<code>${p}</code>`).join(', ')}</p>`,
  isRawBuffer: `<h1>Cannot respond with a raw buffer</h1>
<p>Please base64 encode your response and include a <code>isBase64Encoded: true</code> parameter, or run your response through <code>@architect/functions</code><p>`,
  other: (title, body) => `<h1>${title}</h1>
  <p>${body}<p>`
}

function invalid (res, body) {
  res.statusCode = 502
  res.setHeader('content-type', 'text/html; charset=utf-8;')
  res.setHeader('cache-control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0')
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

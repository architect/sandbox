/**
 * Shared response validation utils
 */

let { template } = require('../../../lib')
let { head } = template

let isBuffer = body => {
  if (body && body instanceof Buffer) return true
  return false
}

let errors = {
  invalidType: (param, type) => `${head}<h1>Invalid response type</h1>
<p><code>${param}</code> parameters must be <code>${type}</code></p>`,
  invalidParam: validParams => `${head}<h1>Invalid response parameter</h1>
<p>Only the following parameters are valid in a response: ${validParams.map(p => `<code>${p}</code>`).join(', ')}</p>`,
  isRawBuffer: `${head}<h1>Cannot respond with a raw buffer</h1>
<p>Please base64 encode your response and include a <code>isBase64Encoded: true</code> parameter, or run your response through <code>@architect/functions</code><p>`,
  notFound: lambda => `${head}<h1>Lambda handler not found</h1>
  <p>Could not find Lambda handler at: <code>${lambda.handlerFile}</code><p>
  <p>Please create a handler file, or run <code>[npx] arc init</code>, or add the following to your project preferences (<code>preferences.arc</code> or <code>prefs.arc</code>) file and restart Sandbox:
  <pre>@create
autocreate true
  <pre>
  </p>`,
  other: (title, body) => `${head}<h1>${title}</h1>
  <p>${body}<p>`,
  chonky: size => `<h1>Invalid payload size</h1>
<p>Responses must be 6MB or less; this response is ${size}</p>`
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

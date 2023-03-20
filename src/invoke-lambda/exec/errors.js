let { template } = require('../../lib')
let { head } = template
let headers = {
  'content-type': 'text/html; charset=utf8;',
  'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
}

module.exports = function errors ({ lambdaError, lambda, type = 'Lambda error' }) {
  let {
    additional,
    errorMessage = '',
    errorType = 'Unknown error',
    stackTrace,
  } = lambdaError
  if (errorMessage) errorMessage = ': ' + errorMessage

  let body = `${head}
<h1>${type}</h1>
<h2>${errorType}${errorMessage}</h2>
<h3>Lambda: <pre>@${lambda.pragma}</pre> <pre>${lambda.name}</pre></h3>
<h3>Source: ${lambda.src}</h3>
<p>${errorMessage}</p>
`
  if (additional) body += `\n<p>${additional}</p>`
  if (stackTrace) body += `\n<code>${stackTrace}</code>`
  else body += '\n<p>(No stack trace)</p>'

  return { statusCode: 500, headers, body }
}

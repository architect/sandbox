let template = require('./template')
let { head } = template
let headers = {
  'content-type': 'text/html; charset=utf8;',
  'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
}

module.exports = function errors ({ lambdaError, lambda, type = 'error' }) {
  let {
    additional,
    errorMessage = '',
    errorType = 'Unknown',
    stackTrace,
  } = lambdaError
  if (errorMessage) errorMessage = ': ' + errorMessage

  let body = `${head}
<h1>Lambda ${type}</h1>
<h2>Error: ${errorType}${errorMessage}</h2>
<h3>Lambda: <code>@${lambda.pragma} ${lambda.name}</code></h3>
<h3>Source: <code>${lambda.src}</code></h3>
<p>${errorMessage}</p>
`
  if (additional) body += `\n<p>${additional}</p>`
  if (stackTrace) body += `\n<h3>Stack trace:</h3><pre><code>${stackTrace}</code></pre>`
  else body += '\n<p>(No stack trace)</p>'

  return { statusCode: 500, headers, body }
}

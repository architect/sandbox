let errors = require('../../lib/errors')
let accepted = 202

let invocations = {}

function runtimeAPI ({ body }, params, req, res) {
  let { update } = params

  // Sandbox does not run actual microcontainers with Lambda RIE; moreover, we want it to reuse the same HTTP server for its runtime API requests
  // We work around this by prepending the request ID to each path, allowing Lambda bootstraps to add the proper paths to env.AWS_LAMBDA_RUNTIME_API (e.g. `get /$requestID/2018-06-01/runtime/invocation/next`)

  let nextEndpoint = '/2018-06-01/runtime/invocation/next'
  let initErrorEndpoint = '/2018-06-01/runtime/init/error'
  // The other two runtime API endpoints use params and relate to invocation (see: isInvoke method below)
  // - res: `/2018-06-01/runtime/invocation/${requestID}/response`
  // - err: `/2018-06-01/runtime/invocation/${requestID}/error`

  let pathParts = req.url.split('/').filter(Boolean)
  let url = '/' + pathParts.slice(1).join('/') // Strip that prepending request ID
  let requestID = pathParts[0]

  // Don't respond to unknown request ID roots
  if (!invocations[requestID]) {
    res.statusCode = 404
    res.end()
    return
  }

  let { lambda } = invocations[requestID]

  function isInvoke () {
    if (!url.startsWith('/2018-06-01/runtime/invocation')) return
    if (pathParts.length !== 6) return
    if (url.endsWith('/response')) return 'response'
    if (url.endsWith('/error')) return 'error'
    if (url.endsWith('/arc_meta')) return 'arc_meta'
  }

  if (url === nextEndpoint) {
    // If we already serviced this request and the bootstrap is requesting the next event, just hold the connection open
    // If we don't, the bootstrap may effectively loop execution and DoS the runtime API until the Sandbox terminates the Lambda
    let { error, initError, response, request } = invocations[requestID]
    if (error || initError || response) return

    // Lambda docs specify old school HTTP header format; expect Node to normalize to lowcase per HTTP 2.0
    let deadline = Date.now() + (lambda.config.timeout * 1000)
    let arn = `Architect Sandbox @${lambda.pragma} ${lambda.name}`
    res.setHeader('Lambda-Runtime-Aws-Request-Id', requestID)
    res.setHeader('Lambda-Runtime-Deadline-Ms', deadline)
    res.setHeader('Lambda-Runtime-Invoked-Function-Arn', arn)
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(request))
  }
  else if (url === initErrorEndpoint) {
    invocations[requestID].initError = errors({
      lambdaError: JSON.parse(body),
      lambda,
      type: 'init error',
    })
    res.statusCode = accepted
    res.end()
  }
  else if (isInvoke() === 'response') {
    if (pathParts[4] !== requestID) {
      apiError({ invocations, endpoint: 'response', update, req, requestID })
      res.statusCode = 500
      return res.end()
    }
    invocations[requestID].response = body && JSON.parse(body) || undefined
    res.statusCode = accepted
    res.end()
  }
  else if (isInvoke() === 'error') {
    if (pathParts[4] !== requestID) {
      apiError({ invocations, endpoint: 'error', update, req, requestID })
      res.statusCode = 500
      return res.end()
    }
    invocations[requestID].error = errors({
      lambdaError: JSON.parse(body),
      lambda,
    })
    res.statusCode = accepted
    res.end()
  }
  else if (isInvoke() === 'arc_meta') {
    invocations[requestID].meta = JSON.parse(body)
    res.end()
  }
  else {
    res.statusCode = 404
    res.end()
  }
}

module.exports = { runtimeAPI, invocations }

function apiError ({ invocations, endpoint, update, req, requestID }) {
  update.error(`Runtime API error: invocation missing from ${endpoint} endpoint
- Endpoint URL: ${req.url}
- Request ID: ${requestID}
- Current invocations: ${JSON.stringify(invocations, null, 2)}`)
}

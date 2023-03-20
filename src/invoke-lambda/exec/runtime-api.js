let http = require('http')
let net = require('net')
let destroyer = require('server-destroy')
let errors = require('./errors')
let lastUsed = 50000

module.exports = function startRuntimeAPI (lambda, params, callback) {
  getPort((err, port) => {
    if (err) callback(err)
    else {
      let { host, invocations, requestID, update } = params
      params.options.env.AWS_LAMBDA_RUNTIME_API = `http://${host || 'localhost'}:${port}`

      let nextEndpoint = '/2018-06-01/runtime/invocation/next'
      let initErrorEndpoint = '/2018-06-01/runtime/init/error'
      // The other two runtime API endpoints use params and relate to invocation (see: isInvoke method below)
      // - res: `/2018-06-01/runtime/invocation/${requestID}/response`
      // - err: `/2018-06-01/runtime/invocation/${requestID}/error`

      let server = http.createServer(function listener (req, res) {
        let pathParts = req.url.split('/').filter(Boolean)
        function isInvoke () {
          if (!req.url.startsWith('/2018-06-01/runtime/invocation')) return
          if (pathParts.length !== 5) return
          if (req.url.endsWith('/response')) return 'response'
          if (req.url.endsWith('/error')) return 'error'
          if (req.url.endsWith('/arc_meta')) return 'arc_meta'
        }

        let body = []
        req.on('data', chunk => body.push(chunk))
        req.on('end', () => {
          body = body.toString()

          if (req.url === nextEndpoint) {
            let { request } = invocations[requestID]
            // Lambda docs specify old school HTTP header format; expect Node to normalize to lowcase per HTTP 2.0
            res.setHeader('Lambda-Runtime-Aws-Request-Id', requestID)
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(request))
          }
          else if (req.url === initErrorEndpoint) {
            // TODO blow up loudly if no requestID is found or if it doesn't match the startRuntimeAPI run?
            invocations[requestID].initError = errors({
              lambdaError: JSON.parse(body),
              lambda,
              type: 'initError',
            })
            res.end()
          }
          else if (isInvoke() === 'response') {
            let requestID = pathParts[3]
            // TODO blow up loudly if no requestID is found or if it doesn't match the startRuntimeAPI run?
            invocations[requestID].response = JSON.parse(body)
            res.end()
          }
          else if (isInvoke() === 'error') {
            let requestID = pathParts[3]
            // TODO blow up loudly if no requestID is found or if it doesn't match the startRuntimeAPI run?
            invocations[requestID].error = errors({
              lambdaError: JSON.parse(body),
              lambda,
            })
            res.end()
          }
          else if (isInvoke() === 'arc_meta') {
            // TODO blow up loudly if no requestID is found or if it doesn't match the startRuntimeAPI run?
            invocations[requestID].meta = JSON.parse(body)
            res.end()
          }
          else {
            res.statusCode = 404
            res.end()
          }
        })
      })
      server.listen(port, host, err => {
        if (err) callback(err)
        else {
          update.verbose.done(`Lambda runtime API started for @${lambda.pragma} '${lambda.name}' on port ${port}`)
          destroyer(server)
          callback(null, server)
        }
      })

    }
  })
}

function getPort (callback) {
  // Reset the port pool
  if (lastUsed > 65000) lastUsed = 50000

  let checking = lastUsed + 1
  let tries = 0
  let tester = net.createServer()
  let done = false
  function check () {
    if (tries === 50) {
      let msg = `Could not find open port after 50 tries, please close some applications and try again`
      return callback(Error(msg))
    }
    tester.listen(checking)
    tester.once('error', err => {
      if (err.message.includes('EADDRINUSE')) {
        tries++
        checking++
        return check()
      }
    })
    tester.once('listening', () => {
      tester.close(() => {
        // Tester close emits multiple events, so only call back once
        if (!done) {
          done = true
          callback(null, checking)
        }
      })
    })
  }
  check()
}

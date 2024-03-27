let { existsSync } = require('fs')
let { randomUUID } = require('crypto')
let chalk = require('chalk')

let getEnv = require('./env')
let exec = require('./exec')
let warn = require('./warn')

let { invocations } = require('../arc/_runtime-api')

let serialize = i => chalk.dim(JSON.stringify(i, null, 2))

module.exports = function invokeLambda (params, callback) {
  let { apiType, event, inventory, lambda, staticPath, update } = params

  // handlerFile is defined for all non-ASAP functions; ASAP bypasses this check
  if (!hasHandler(lambda)) {
    return callback(Error('lambda_not_found'))
  }

  // Next check payload size is within limits
  let maxSize = 1000 * 6000
  let { body, Records } = event
  let bodySize = (body && JSON.stringify(body).length) || 0
  let payloadSize = (Records && JSON.stringify(Records).length) || 0
  if (bodySize > maxSize || payloadSize > maxSize) {
    let err = Error('Maximum event body exceeded: Lambda allows up to 6MB payloads (base64-encoded)')
    return callback(err)
  }

  // Now send along for execution
  let { build, config, pragma, name, src } = lambda
  let requestID = randomUUID()

  update.debug.status(`[${requestID}] Invoking '@${pragma} ${name}' Lambda with the following configuration:`)
  update.debug.raw(serialize(lambda))

  let max = 10000
  let output = serialize(event).substr(0, max)
  let chonky = output.length === max
  update.debug.status(`[${requestID}] Lambda event payload`)
  update.debug.raw(output + '...')
  if (chonky) update.debug.status(`[${requestID}] Truncated event payload log at 10KB`)

  let coldstart = inventory.inv._project?.preferences?.sandbox?.coldstart || false

  invocations[requestID] = {
    request: event,
    lambda,
  }

  exec(lambda, {
    // Internal execution context
    context: { apiType, inventory, staticPath, update },
    // Child process options
    options: {
      cwd: build || src,
      env: getEnv(params, requestID),
      shell: true,
    },
    requestID,
    timeout: config.timeout * 1000,
    coldstart,
    update,
  }, function done (err) {
    update.debug.status(`[${requestID}] Final invocation state`)
    update.debug.raw(serialize(invocations[requestID]))
    if (err) {
      delete invocations[requestID]
      update.debug.status(`[${requestID}] Invocation error`)
      callback(err)
    }
    else {
      let { error, initError, response, meta = {} } = invocations[requestID]
      delete invocations[requestID]

      // Dependency warning debugger - handy for introspection during Lambda execution
      let { missing, debug } = meta
      warn({ missing, inventory, src, update })
      if (debug) {
        update.debug.status(`[${requestID}] Lambda debug data:`)
        update.debug.raw(serialize(debug))
      }
      update.debug.status(`[${requestID}] Invocation successfully completed`)

      callback(null, response, error, initError)
    }
  })
}

function hasHandler (lambda) {
  let { handlerFile, arcStaticAssetProxy, _skipHandlerCheck } = lambda
  // We don't need to do a handlerFile check if it's an ASAP / Arc 6 greedy root req
  if (arcStaticAssetProxy || _skipHandlerCheck) return true
  return existsSync(handlerFile)
}

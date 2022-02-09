let { existsSync } = require('fs')
let chalk = require('chalk')

let getEnv = require('./env')
let exec = require('./exec')
let warn = require('./warn')

let serialize = i => chalk.dim(JSON.stringify(i, null, 2))

module.exports = function invokeLambda (params, callback) {
  let { apiType, cwd, event, inventory, lambda, staticPath, update } = params

  // handlerFile is defined for all non-ASAP functions; ASAP bypasses this check
  if (!hasHandler(lambda)) {
    return callback(Error('lambda_not_found'))
  }

  // Next check payload size is within limits
  let maxSize = 1000 * 6000
  let { body, Records } = event
  let bodySize = body && JSON.stringify(body).length || 0
  let payloadSize = Records && JSON.stringify(Records).length || 0
  if (bodySize > maxSize || payloadSize > maxSize) {
    let err = Error('Maximum event body exceeded: Lambda allows up to 6MB payloads (base64-encoded)')
    return callback(err)
  }

  // Now send along for execution
  let { build, src, config } = lambda
  let lambdaPath = src.replace(cwd, '').substr(1)

  update.debug.status(`Lambda config: ${lambdaPath}`)
  update.debug.raw(serialize(lambda))

  let max = 10000
  let output = serialize(event).substr(0, max)
  let chonky = output.length === 10000
  update.debug.status(`Lambda event payload: ${lambdaPath}`)
  update.debug.raw(output + '...')
  if (chonky) update.debug.status('Truncated event payload log at 10KB')

  exec(lambda, {
    // Internal execution context
    context: { apiType, inventory, staticPath, update },
    // Child process options
    options: {
      cwd: build || src,
      env: getEnv(params),
      shell: true,
    },
    request: JSON.stringify(event),
    timeout: config.timeout * 1000,
  }, function done (err, result, meta = {}) {
    if (err) callback(err)
    else {
      let { missing, debug } = meta
      // Dependency warning debugger - handy for introspection during Lambda execution
      if (debug) {
        update.debug.status(`Lambda debug data: ${lambdaPath}`)
        update.debug.raw(serialize(debug))
      }
      warn({ missing, inventory, src, update })
      callback(null, result)
    }
  })
}

function hasHandler (lambda) {
  let { handlerFile, arcStaticAssetProxy, _skipHandlerCheck } = lambda
  // We don't need to do a handlerFile check if it's an ASAP / Arc 6 greedy root req
  if (arcStaticAssetProxy || _skipHandlerCheck) return true
  return existsSync(handlerFile)
}

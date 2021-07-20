let { join } = require('path')
let { existsSync } = require('fs')
let chalk = require('chalk')

let runInNode = require('./run-in-node')
let runInDeno = require('./run-in-deno')
let runInPython = require('./run-in-python')
let runInRuby = require('./run-in-ruby')

let warn = require('./warn')
let missingRuntime = require('./missing-runtime')

let serialize = i => chalk.dim(JSON.stringify(i, null, 2))

/**
 * mocks a lambda.. not much to it eh!
 *
 * @param {string} function - Inventory function object
 * @param {object} event - HTTP / event payload to invoke lambda function with
 * @param {function} callback - node style errback
 */
module.exports = function invokeLambda (params, callback) {
  let { cwd, lambda, event, inventory, update } = params
  // handlerFile is defined for all non-ASAP functions; ASAP bypasses this check
  if (!hasHandler(lambda)) {
    callback(Error('lambda_not_found'))
  }
  else {
    let maxSize = 1000 * 6000
    let { body, Records } = event
    let bodySize = body && JSON.stringify(body).length || 0
    let payloadSize = Records && JSON.stringify(Records).length || 0
    if (bodySize > maxSize || payloadSize > maxSize) {
      let err = Error('Maximum event body exceeded: Lambda allows up to 6MB payloads (base64-encoded)')
      callback(err)
    }
    else {
      let { src, config } = lambda
      let { runtime, timeout } = config
      let lambdaPath = src.replace(cwd, '').substr(1)

      update.debug.status(`Lambda config: ${lambdaPath}`)
      update.debug.raw(serialize(lambda))

      let PYTHONPATH = process.env.PYTHONPATH
        ? `${join(src, 'vendor')}:${process.env.PYTHONPATH}`
        : join(src, 'vendor')

      let appName = inventory.inv.app // needs camelcase
      let env = 'Testing' // is this right?
      let functionName = src.split('/').pop() // this isn't right

      let defaults = {
        __ARC_CONTEXT__: JSON.stringify({
          'functionName': `${appName}${env}-${functionName}`,
          'functionVersion': '$LATEST',
          // todo awsRequestId // needs to be a first class thing right now it only exists in request context for websockets
        }),
        __ARC_CONFIG__: JSON.stringify({
          projectSrc: cwd,
          handlerFile: 'index',
          handlerFunction: 'handler',
          shared: inventory.inv.shared,
          views: inventory.inv.views,
        }),
        PYTHONUNBUFFERED: true,
        PYTHONPATH,
        LAMBDA_TASK_ROOT: src,
        TZ: 'UTC',
      }

      let options = {
        shell: true,
        cwd: src,
        env: { ...process.env, ...defaults }
      }
      let request = JSON.stringify(event)

      let max = 10000
      let output = serialize(event).substr(0, max)
      let chonky = output.length === 10000
      update.verbose.status(`Lambda event payload: ${lambdaPath}`)
      update.verbose.raw(output + '...')
      if (chonky) update.verbose.status('Truncated event payload log at 10KB')

      let exec
      if (runtime.startsWith('nodejs')) exec = runInNode
      if (runtime.startsWith('deno'))   exec = runInDeno
      if (runtime.startsWith('python')) exec = runInPython
      if (runtime.startsWith('ruby'))   exec = runInRuby

      if (!exec) {
        missingRuntime({ cwd, runtime, src, update })
        return callback('Missing runtime')
      }
      exec({
        options,
        request,
        timeout: timeout * 1000,
        update
      }, function done (err, result) {
        if (err) callback(err)
        else {
          let missing
          if (result && result.__DEP_ISSUES__) {
            missing = result.__DEP_ISSUES__
            delete result.__DEP_ISSUES__
          }
          // Dependency warning debugger - handy for introspection during Lambda execution
          if (result && result.__DEP_DEBUG__) {
            update.debug.status(`Lambda dependency tree: ${lambdaPath}`)
            update.debug.raw(serialize(result.__DEP_DEBUG__))
            delete result.__DEP_DEBUG__
          }
          warn({ cwd, missing, inventory, src, update })
          callback(null, result)
        }
      })
    }
  }
}

// Handle multi-handler exploration here
function hasHandler (lambda) {
  let { src, handlerFile, _proxy } = lambda
  // We don't need to do a handlerFile check if it's an ASAP / Arc 6 greedy root req
  if (_proxy) return true
  let { runtime } = lambda.config
  if (runtime === 'deno') {
    let found = false
    let paths = [
      join(src, 'index.js'),
      join(src, 'mod.js'),
      join(src, 'index.ts'),
      join(src, 'mod.ts'),
      join(src, 'index.tsx'),
      join(src, 'mod.tsx'),
    ]
    paths.forEach(p => {
      if (found) return
      if (existsSync(p)) found = p
    })
    return found
  }
  else return handlerFile && existsSync(handlerFile)
}

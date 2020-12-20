let { join } = require('path')
let { existsSync } = require('fs')

let runInNode = require('./run-in-node')
let runInDeno = require('./run-in-deno')
let runInPython = require('./run-in-python')
let runInRuby = require('./run-in-ruby')

let warn = require('./warn')
let missingRuntime = require('./missing-runtime')

/**
 * mocks a lambda.. not much to it eh!
 *
 * @param {string} function - Inventory function object
 * @param {object} event - HTTP / event payload to invoke lambda function with
 * @param {function} callback - node style errback
 */
module.exports = function invokeLambda (lambda, event, callback) {
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

      let defaults = {
        __ARC_CONTEXT__: JSON.stringify({}), // TODO add more stuff to sandbox context
        __ARC_CONFIG__: JSON.stringify({
          projectSrc: process.cwd(),
          handlerFile: 'index',
          handlerFunction: 'handler',
        }),
        PYTHONUNBUFFERED: true,
        PYTHONPATH: join(src, 'vendor'),
        LAMBDA_TASK_ROOT: src,
        TZ: 'UTC',
      }

      let options = {
        shell: true,
        cwd: src,
        env: { ...process.env, ...defaults }
      }
      let request = JSON.stringify(event)

      let exec
      if (runtime.startsWith('nodejs')) exec = runInNode
      if (runtime.startsWith('deno'))   exec = runInDeno
      if (runtime.startsWith('python')) exec = runInPython
      if (runtime.startsWith('ruby'))   exec = runInRuby

      if (!exec) {
        missingRuntime(runtime, src)
        return callback('Missing runtime')
      }
      exec(options, request, timeout * 1000, function done (err, result) {
        if (err) callback(err)
        else {
          let missing
          if (result && result.__DEP_ISSUES__) {
            missing = result.__DEP_ISSUES__
            delete result.__DEP_ISSUES__
          }
          warn(missing, src)
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

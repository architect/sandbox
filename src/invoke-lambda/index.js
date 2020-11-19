let { join } = require('path')
let { existsSync } = require('fs')

let runInNode = require('./run-in-node')
let runInDeno = require('./run-in-deno')
let runInPython = require('./run-in-python')
let runInRuby = require('./run-in-ruby')

let warn = require('./warn')
let missingRuntime = require('./missing-runtime')

let runtimes = {
  'nodejs12.x': runInNode,
  'nodejs10.x': runInNode,
  'nodejs8.10': runInNode, // DEPRECATED by AWS Jan/Feb 2020; will retain Node 8 until ~mid 2020
  'deno':       runInDeno,
  'python3.8':  runInPython,
  'python3.6':  runInPython,
  'python3.7':  runInPython,
  'ruby2.5':    runInRuby,
  // 'go1.x': runInGo,
  // 'dotnetcore2.1': runInDotNet,
  // 'java8': runInJava,
}

/**
 * mocks a lambda.. not much to it eh!
 *
 * @param {string} function - Inventory function object
 * @param {object} event - HTTP / event payload to invoke lambda function with
 * @param {function} callback - node style errback
 */
module.exports = function invokeLambda (lambda, event, callback) {
  let { src, handlerFile } = lambda
  // handlerFile is defined for all non-ASAP functions; ASAP bypasses this check
  if (handlerFile && !existsSync(handlerFile)) {
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
      let { runtime, timeout } = lambda.config

      if (!runtimes[runtime]) {
        missingRuntime(runtime, src)
        callback('Missing runtime')
        return
      }
      runtimes[runtime](options, request, timeout * 1000, function done (err, result) {
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

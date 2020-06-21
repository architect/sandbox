let path = require('path')
let fs = require('fs')

let getConfig = require('./get-config')
let runInNode = require('./run-in-node')
let runInDeno = require('./run-in-deno')
let runInPython = require('./run-in-python')
let runInRuby = require('./run-in-ruby')

let warn = require('./warn')

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
 * @param {string} pathToLambda - path to lambda function code
 * @param {object} event - HTTP / event payload to invoke lambda function with
 * @param {function} callback - node style errback
 */
module.exports = function invokeLambda (pathToLambda, event, callback) {
  if (!fs.existsSync(pathToLambda)) {
    callback(Error(`Lambda not found: ${pathToLambda}`))
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
        PYTHONUNBUFFERED: true,
        PYTHONPATH: path.join(pathToLambda, 'vendor'),
        LAMBDA_TASK_ROOT: pathToLambda,
      }

      let options = {
        shell: true,
        cwd: pathToLambda,
        env: { ...process.env, ...defaults }
      }

      let request = JSON.stringify(event)

      getConfig(pathToLambda, function done (err, { runtime, timeout }) {
        if (err) callback(err)
        else {
          runtimes[runtime](options, request, timeout, function done (err, result) {
            if (err) callback(err)
            else {
              let missing
              if (result && result.__DEP_ISSUES__) {
                missing = result.__DEP_ISSUES__
                delete result.__DEP_ISSUES__
              }
              warn(missing, pathToLambda)
              callback(null, result)
            }
          })
        }
      })
    }
  }
}

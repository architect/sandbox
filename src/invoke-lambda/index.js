let path = require('path')

let getConfig = require('./get-config')
let runInNode = require('./run-in-node')
let runInPython = require('./run-in-python')
let runInRuby = require('./run-in-ruby')

let runtimes = {
  'nodejs10.x': runInNode,
  'nodejs8.10': runInNode,
  'python3.6': runInPython,
  'python3.7': runInPython,
  'ruby2.5': runInRuby,
  // TODO
  // 'go1.x': runInGo,
  // 'dotnetcore2.1': runInDotNet,
  // 'java8': runInJava,
}

/**
 * mocks a lambda.. not much to it eh!
 *
 * @param {string} pathToLambda - path to lambda function code
 * @param {object} event - payload to invoke lambda function with
 * @param {function} callback - node style errback
 */
module.exports = function invokeLambda(pathToLambda, event, callback) {

  let defaults = {
    __ARC_REQ__: JSON.stringify(event),
    __ARC_CONTEXT__: {}, // TODO add more stuff to sandbox context
    PYTHONUNBUFFERED: true,
    PYTHONPATH: path.join(pathToLambda, 'vendor')
  }

  let options = {
    shell: true,
    cwd: pathToLambda,
    env: {...process.env, ...defaults}
  }

  getConfig(pathToLambda, function done(err, {runtime, timeout}) {
    if (err) callback(err)
    else {
      runtimes[runtime](options, timeout, callback)
    }
  })
}

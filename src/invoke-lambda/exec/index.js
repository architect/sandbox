let _asap = require('@architect/asap')
let load = require('./loader')
let spawn = require('./spawn')
let { runtimeEval } = require('../../lib')
let { invocations } = require('../../arc/_runtime-api')

module.exports = function exec (lambda, params, callback) {
  // ASAP is a special case that doesn't spawn
  if (lambda.arcStaticAssetProxy) {
    let { context, requestID } = params
    let asap = _asap({
      // Runs ASAP in local mode, skipping bucket config / env var checks, etc.
      env: 'testing',
      // `sandboxPath` named differently because `staticPath` was too vague within ASAP
      sandboxPath: context.staticPath,
      // Pick up SPA setting (which may be overridden by process ARC_STATIC_SPA within ASAP)
      spa: context.inventory.inv?.static?.spa
    })
    asap(invocations[requestID].request)
      .then(result => {
        invocations[requestID].response = result
        callback()
      })
      .catch(callback)
  }
  // Built-in runtimes or custom runtimes that rely on a `baseRuntime`
  else {
    let run = getRuntime(lambda)
    if (run === '_compiled') {
      var command = lambda.handlerFile
      var args = []
    }
    else {
      let bootstrap = load()[run]
      var { command, args } = runtimeEval[run](bootstrap)
    }
    spawn({ command, args, ...params, lambda }, callback)
  }
}

function getRuntime ({ config, handlerModuleSystem }) {
  let { runtime, runtimeConfig } = config
  let run = runtimeConfig?.baseRuntime || runtime
  if (run.startsWith('node')) {
    if (handlerModuleSystem === 'esm') return 'node-esm'
    return 'node'
  }
  else if (run.startsWith('deno'))   return 'deno'
  else if (run.startsWith('ruby'))   return 'ruby'
  else if (run.startsWith('python')) return 'python'
  else if (runtimeConfig?.type === 'compiled') return '_compiled'
}

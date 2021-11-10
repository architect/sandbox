let _asap = require('@architect/asap')
let load = require('./_loader')
let spawn = require('./spawn')
let { runtimeEval } = require('../lib')

module.exports = function exec (run, params, callback) {
  // ASAP is a special case that doesn't spawn
  if (run === 'asap') {
    let { context, request } = params
    let asap = _asap({
      // Runs ASAP in local mode, skipping bucket config / env var checks, etc.
      env: 'testing',
      // `sandboxPath` named differenty because `staticPath` was too vague within ASAP
      sandboxPath: context.staticPath,
      // Pick up SPA setting (which may be overridden by process ARC_STATIC_SPA within ASAP)
      spa: context.inventory.inv?.static?.spa
    })
    asap(JSON.parse(request))
      .then(result => callback(null, result))
      .catch(callback)
  }
  else {
    let bootstrap = load()[run]
    let { command, args } = runtimeEval[run](bootstrap)
    spawn({ command, args, ...params }, callback)
  }
}

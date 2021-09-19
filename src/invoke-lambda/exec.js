let { sep } = require('path')
let _asap = require('@architect/asap')
let load = require('./_loader')
let spawn = require('./spawn')

let runtimes = {
  deno: function (params, bootstrap) {
    // Add this via env var since `\\` breaks stdin, and Deno doesn't have a path.sep builtin
    params.options.env.__ARC_META__ = JSON.stringify({ sep })
    return {
      command: 'deno',
      args: [ 'eval', bootstrap ],
    }
  },
  node: function (params, bootstrap) {
    // process.pkg = binary dist mode, leading space works around pkg#897
    return {
      command: process.pkg ? ' ' : 'node',
      args: process.pkg ? [ 'node', '-e', bootstrap ] : [ '-e', bootstrap ],
    }
  },
  python: function (params, bootstrap) {
    // Windows `python -c` doesn't like multi-liners, so serialize script
    let command = process.platform === 'win32' ? 'python' : 'python3'
    return {
      command,
      args: [ '-c', bootstrap ],
    }
  },
  ruby: function (params, bootstrap) {
    return {
      command: 'ruby',
      args: bootstrap,
    }
  }
}

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
    let { command, args } = runtimes[run](params, bootstrap)
    spawn({ command, args, ...params }, callback)
  }
}

let { join } = require('path')
let spawn = require('./spawn')

module.exports = function runInNode (params, callback) {
  let deno = join(__dirname, 'runtimes', 'deno.js')
  let root = params.options.env.LAMBDA_TASK_ROOT
  params.options.env = { ...params.options.env, 'DENO_DIR': join(root, 'vendor', '.deno_cache') }
  spawn({
    command: 'deno',
    args: [
      'run', '-A', '--unstable', deno
    ],
    ...params,
  }, callback)
}

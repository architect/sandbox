let { join } = require('path')
let spawn = require('./spawn')

module.exports = function runInNode (params, callback) {
  let deno = join(__dirname, 'runtimes', 'deno.js')
  spawn({
    command: 'deno',
    args: [
      'run', '-A', '--unstable', '--reload', deno
    ],
    ...params,
  }, callback)
}

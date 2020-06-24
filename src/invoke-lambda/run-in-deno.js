let path = require('path')
let spawn = require('./spawn')

module.exports = function runInNode (options, request, timeout, callback) {
  spawn('deno', [
    'run', '-A', '--unstable', '--reload', path.join(__dirname, 'runtimes', 'deno.js')
  ], options, request, timeout, callback)
}

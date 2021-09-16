let load = require('./_loader')
let { sep } = require('path')
let spawn = require('./spawn')

module.exports = function runInNode (params, callback) {
  let { deno } = load()
  // Add this via env var since `\\` breaks stdin, and Deno doesn't have a path.sep builtin
  params.options.env.__ARC_META__ = JSON.stringify({ sep })
  spawn({
    command: 'deno',
    args: [ 'eval', deno ],
    ...params,
  }, callback)
}

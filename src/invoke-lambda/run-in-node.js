let load = require('./_loader')
let spawn = require('./spawn')

module.exports = function runInNode (params, callback) {
  let { node } = load()
  let command = 'node'
  let args = [ '-e', node ]
  // Binary dist mode, fix pkg#897
  if (process.pkg) {
    command = ' '
    args.unshift('node')
  }
  spawn({
    command,
    args,
    ...params,
  }, callback)
}

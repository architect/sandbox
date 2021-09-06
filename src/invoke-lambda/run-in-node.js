let load = require('./runtimes/_loader')
let spawn = require('./spawn')

module.exports = function runInNode (params, callback) {
  let { node } = load()
  let minify = script => '"' + script.replace(/\n/g, '').trim() + '"'
  let script = minify(node)
  let command = 'node'
  let args = [ '-e', script ]
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

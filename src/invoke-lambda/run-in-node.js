let load = require('./runtimes/_loader')
let spawn = require('./spawn')

module.exports = function runInNode (params, callback) {
  let { node } = load()
  let minify = script => '"' + script.replace(/\n/g, '').trim() + '"'
  let script = minify(node)
  spawn({
    command: 'node',
    args: [ '-e', script ],
    ...params,
  }, callback)
}

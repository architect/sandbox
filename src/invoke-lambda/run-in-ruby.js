let load = require('./runtimes/_loader')
let spawn = require('./spawn')

module.exports = function runInRuby (params, callback) {
  let { ruby } = load()
  let args = ruby
    .split('\n')
    .filter(Boolean)
    .map(line => [ '-e', `"${line}"` ])
    .reduce((a, b) => a.concat(b))
  spawn({
    command: 'ruby',
    args,
    ...params,
  }, callback)
}

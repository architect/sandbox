let load = require('./_loader')
let spawn = require('./spawn')

module.exports = function runInRuby (params, callback) {
  let { ruby } = load()
  spawn({
    command: 'ruby',
    args: ruby,
    ...params,
  }, callback)
}

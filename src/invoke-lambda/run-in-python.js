let load = require('./_loader')
let spawn = require('./spawn')

module.exports = function runInPython (params, callback) {
  let { python } = load()
  // Windows `python -c` doesn't like multi-liners, so serialize script
  let command = process.platform === 'win32' ? 'python' : 'python3'
  spawn({
    command,
    args: [ '-c', python ],
    ...params,
  }, callback)
}

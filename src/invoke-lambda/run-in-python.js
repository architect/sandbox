let load = require('./runtimes/_loader')
let spawn = require('./spawn')

module.exports = function runInPython (params, callback) {
  let { python } = load()
  // Windows `python -c` doesn't like multi-liners, so serialize script
  let command = process.platform === 'win32' ? 'python' : 'python3'
  let script = python.split('\n').filter(l => l.trim() !== '').join(';')
  script = `"${script}"`
  spawn({
    command,
    args: [ '-c', script ],
    ...params,
  }, callback)
}

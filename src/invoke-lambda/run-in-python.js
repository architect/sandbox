let { readFile } = require('fs')
let { join } = require('path')
let spawn = require('./spawn')

module.exports = function runInPython (params, callback) {
  let python = join(__dirname, 'runtimes', 'python.py')
  let py = process.platform === 'win32' ? 'python' : 'python3'
  readFile(python, 'utf8', function done (err, data) {
    if (err) callback(err)
    else {
      // Windows `python -c` doesn't like multi-liners, so serialize script
      data = data.toString().split('\n').filter(l => l.trim() !== '').join(';')
      let script = `"${data}"`
      spawn({
        command: py,
        args: [ '-c', script ],
        ...params,
      }, callback)
    }
  })
}

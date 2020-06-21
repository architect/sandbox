let fs = require('fs')
let path = require('path')
let spawn = require('./spawn')

module.exports = function runInPython (options, request, timeout, callback) {
  let python = path.join(__dirname, 'runtimes', 'python.py')
  let py = process.platform === 'win32' ? 'python' : 'python3'
  fs.readFile(python, 'utf8', function done (err, data) {
    if (err) callback(err)
    else {
      // Windows `python -c` doesn't like multi-liners, so serialize script
      data = data.toString().split('\n').filter(l => l.trim() !== '').join(';')
      let script = `"${data}"`
      spawn(py, [ '-c', script ], options, request, timeout, callback)
    }
  })
}

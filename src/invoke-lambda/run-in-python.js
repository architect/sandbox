let fs = require('fs')
let path = require('path')
let spawn = require('./spawn')

module.exports = function runInPython(options, timeout, callback) {
  let python = path.join(__dirname, 'runtimes', 'python.py')
  let py = process.platform === 'win32' ? 'python.exe' : 'python3'
  fs.readFile(python, 'utf8', function done(err, data) {
    if (err) callback(err)
    else {
      let script = `"${data.toString()}"`
      spawn(py, ['-c', script], options, timeout, callback)
    }
  })
}

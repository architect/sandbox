let fs = require('fs')
let path = require('path')
let spawn = require('./spawn')

module.exports = function runInPython(options, timeout, callback) {
  let python = path.join(__dirname, 'runtimes', 'python.py')
  let py = process.platform === 'win32' ? 'python' : 'python3'
  fs.readFile(python, 'utf8', function done(err, data) {
    if (err) callback(err)
    else {
      data = data.toString().split('\n').filter(l => l !== '').join(';')
      let script = `"${data}"`
      spawn(py, ['-c', script], options, timeout, callback)
    }
  })
}

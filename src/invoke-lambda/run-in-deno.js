let fs = require('fs')
let path = require('path')
let spawn = require('./spawn')

module.exports = function runInNode(options, timeout, callback) {
  let deno = path.join(__dirname, 'runtimes', 'deno.js')
  fs.readFile(deno, 'utf8', function done(err, data) {
    if (err) callback(err)
    else {
      let minify = script=> '"' + script.replace(/\n/g, '').trim() + '"'
      let script = minify(data.toString())
      spawn('deno', ['eval', script], options, timeout, callback)
    }
  })
}

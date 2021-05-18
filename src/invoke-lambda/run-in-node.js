let { readFile } = require('fs')
let { join } = require('path')
let spawn = require('./spawn')

module.exports = function runInNode (params, callback) {
  let node = join(__dirname, 'runtimes', 'node.js')
  readFile(node, 'utf8', function done (err, data) {
    if (err) callback(err)
    else {
      let minify = script => '"' + script.replace(/\n/g, '').trim() + '"'
      let script = minify(data.toString())
      spawn({
        command: 'node',
        args: [ '-e', script ],
        ...params,
      }, callback)
    }
  })
}

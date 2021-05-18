let { readFile } = require('fs')
let { join } = require('path')
let spawn = require('./spawn')

module.exports = function runInRuby (params, callback) {
  let ruby = join(__dirname, 'runtimes', 'ruby.rb')
  readFile(ruby, 'utf8', function done (err, data) {
    if (err) callback(err)
    else {
      let script = data.toString()
      let args = script
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
  })
}

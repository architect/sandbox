let { readFileSync } = require('fs')
let { join } = require('path')
let handlers

module.exports = function () {
  if (handlers) return handlers
  handlers = {}
  let runtimes = [ 'node.js', 'python.py', 'ruby.rb' ]
  runtimes.forEach(runtime => {
    try {
      let name = runtime.split('.')[0]
      let path = join(__dirname, runtime)
      handlers[name] = readFileSync(path).toString()
    }
    catch (err) {
      throw Error(err)
    }
  })
  return handlers
}

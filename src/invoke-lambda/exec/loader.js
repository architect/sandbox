let { readFileSync } = require('fs')
let { join } = require('path')
let lTrimm = l => l.trim() !== '' // boom
let handlers

module.exports = function () {
  if (handlers) return handlers
  handlers = {}
  let runtimes = [ 'deno.mjs', 'node.js', 'node-esm.mjs', 'python.py', 'ruby.rb' ]
  runtimes.forEach(runtime => {
    try {
      let name = runtime.split('.')[0]
      let path = join(__dirname, 'runtimes', runtime)
      let bootstrap = readFileSync(path).toString()
      let script
      if (runtime.endsWith('.js') || runtime.endsWith('.mjs')) {
        script = '"' + bootstrap
          .replace(/\n/g, '')
          .replace(/\`/g, '\\\`')
          .trim() + '"'
      }
      if (runtime.endsWith('.py')) {
        script = '"' + bootstrap.split('\n').filter(lTrimm).join(';') + '"'
      }
      if (runtime.endsWith('.rb')) {
        script = bootstrap
          .split('\n')
          .filter(lTrimm)
          .map(line => [ '-e', `"${line}"` ])
          .reduce((a, b) => a.concat(b))
      }
      handlers[name] = script
    }
    catch (err) {
      throw Error(err)
    }
  })
  return handlers
}

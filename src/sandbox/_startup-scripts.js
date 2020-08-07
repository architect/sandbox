let { existsSync: exists } = require('fs')
let { execSync: exec } = require('child_process')
let { join } = require('path')

module.exports = function startupScripts (params, callback) {
  let { arc, update } = params

  let initJS = join(process.cwd(), 'scripts', 'sandbox-startup.js')
  let initPy = join(process.cwd(), 'scripts', 'sandbox-startup.py')
  let initRb = join(process.cwd(), 'scripts', 'sandbox-startup.rb')

  let script
  if (exists(initJS))       script = initJS
  else if (exists(initPy))  script = initPy
  else if (exists(initRb))  script = initRb

  if (script) {
    update.status('Running sandbox init script')
    let now = Date.now()
    let run
    let runtime
    if (script === initJS) {
      // eslint-disable-next-line
      let js = require(script)
      run = js(arc)
      runtime = 'Node.js'
    }
    else if (script === initPy) {
      run = exec(`python ${initPy}`)
      runtime = 'Python'
    }
    else {
      run = exec(`ruby ${initRb}`)
      runtime = 'Ruby'
    }
    Promise.resolve(run).then(
      function done (result) {
        if (result) {
          update.done(`Init (${runtime}):`)
          let print =
            result
              .toString()
              .trim()
              .split('\n')
              .map(l => `    ${l.trim()}`)
              .join('\n')
          console.log(print)
        }
        update.done(`Sandbox init script ran in ${Date.now() - now}ms`)
        callback()
      }
    )
  }
  else callback()
}

let { exec } = require('child_process')
let series = require('run-series')
let { userEnvVars } = require('../lib')

module.exports = function startupScripts (params, callback) {
  let { cwd, inventory, update, restart, runStartupCommands = true } = params
  if (restart) {
    return callback()
  }

  let { preferences: prefs } = inventory.inv._project
  // TODO [deprecate]: remove 'sandbox-startup' eventually
  let startupCommands = prefs?.['sandbox-start'] || prefs?.['sandbox-startup']

  if (startupCommands && runStartupCommands) {
    let now = Date.now()
    let ARC_INV = JSON.stringify(inventory.inv)
    let ARC_RAW = JSON.stringify(inventory.inv._project.arc)
    let envVars = userEnvVars(params)
    update.status('Running startup scripts')
    let ops = startupCommands.map(cmd => {
      return function (callback) {
        let env = { ...process.env, ARC_INV, ARC_RAW, ...envVars }
        exec(cmd, { cwd, env }, function (err, stdout, stderr) {
          if (err) callback(err)
          else {
            stdout = stdout ? stdout.toString() : ''
            stderr = stderr ? stderr.toString() : ''
            let output = `${stdout + stderr}`.split('\n').filter(Boolean)
            update.status(cmd, ...output)
            callback()
          }
        })
      }
    })
    series(ops, function (err) {
      if (err) callback(err)
      else {
        update.done(`Sandbox startup scripts ran in ${Date.now() - now}ms`)
        callback()
      }
    })
  }
  else callback()
}

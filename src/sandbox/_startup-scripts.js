let { exec } = require('child_process')
let series = require('run-series')

module.exports = function startupScripts (params, callback) {
  let { cwd, inventory, update, userEnv, runStartupCommands = true } = params
  let { preferences: prefs } = inventory.inv._project

  if (prefs?.['sandbox-startup'] && runStartupCommands) {
    let now = Date.now()
    let ARC_INV = JSON.stringify(inventory.inv)
    let ARC_RAW = JSON.stringify(inventory.inv._project.arc)
    update.status('Running startup scripts')
    let ops = prefs['sandbox-startup'].map(cmd => {
      return function (callback) {
        let env = { ARC_INV, ARC_RAW, ...userEnv, ...process.env }
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

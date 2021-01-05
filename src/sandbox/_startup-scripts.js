let { exec } = require('child_process')
let series = require('run-series')

module.exports = function startupScripts (params, callback) {
  let { inventory, update } = params
  let { preferences: prefs } = inventory.inv._project

  if (prefs && prefs.sandbox && prefs.sandbox.startup) {
    update.warn('The @sandbox scripts setting has been deprecated, please use the @sandbox-startup pragma')
    callback()
  }
  else if (prefs && prefs['sandbox-startup']) {
    let now = Date.now()
    // let ARC_INV = JSON.stringify(inventory.inv) // TODO enable soon once Inventory settles
    let ARC_RAW = JSON.stringify(inventory.inv._project.arc)
    update.status('Running startup scripts')
    let ops = prefs['sandbox-startup'].map(cmd => {
      return function (callback) {
        let env = { /* ARC_INV, */ ARC_RAW, ...process.env }
        exec(cmd, { env }, function (err, stdout, stderr) {
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

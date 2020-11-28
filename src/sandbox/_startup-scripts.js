let { exec } = require('child_process')
let series = require('run-series')

module.exports = function startupScripts (params, callback) {
  let { inventory, update } = params
  let { preferences: prefs } = inventory.inv._project

  if (prefs && prefs.sandbox && prefs.sandbox.startup) {
    let now = Date.now()
    // let ARC_INV = JSON.stringify(inventory.inv) // TODO enable soon once Inventory settles
    let ARC_RAW = JSON.stringify(inventory.inv._project.arc)
    update.status('Running startup scripts')
    let ops = Object.entries(prefs.sandbox.startup).map(([ cmd, args ]) => {
      return function (callback) {
        if (!Array.isArray(args)) {
          callback(Error(`Sandbox startup scripts must have at least one argument (or comment): ${args}`))
          return
        }
        let command = `${cmd} ${args.join(' ')}`
        let env = { /* ARC_INV, */ ARC_RAW, ...process.env }
        exec(command, { env }, function (err, stdout, stderr) {
          if (err) callback(err)
          else {
            stdout = stdout ? stdout.toString() : ''
            stderr = stderr ? stderr.toString() : ''
            let output = `${stdout + stderr}`.split('\n').filter(Boolean)
            update.status(command, ...output)
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

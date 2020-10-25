let { exec } = require('child_process')
let series = require('run-series')

module.exports = function startupScripts (params, callback) {
  let { inventory, update } = params
  let { preferences: prefs } = inventory.inv._project

  if (prefs && prefs.sandbox && prefs.sandbox.startup) {
    let now = Date.now()
    update.status('Running startup scripts')
    let ops = Object.entries(prefs.sandbox.startup).map(([ cmd, args ]) => {
      return function (callback) {
        let command = `${cmd} ${args.join(' ')}`
        exec(command, function (err, stdout, stderr) {
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

let { updater } = require('@architect/utils')
let { version: pkgVer } = require('../../package.json')

let sandbox = require('../sandbox')
let rehydrator = require('./_rehydrate')
let watch = require('./_watcher')
let stdin = require('./_stdin')

module.exports = function cli (params = {}, callback) {
  let { version, inventory, logLevel, quiet, symlink } = params
  if (!version) version = `Sandbox ${pkgVer}`

  sandbox.start(params, function watching (err) {
    if (err) {
      sandbox.end()
      if (callback) callback(err)
      else process.exit(1)
    }
    else if (callback) callback()

    // Setup
    let update = updater('Sandbox', { logLevel, quiet })
    let debounce = 100

    // Timestamper
    let ts = (now) => {
      if (!quiet) {
        now = now || Date.now()
        let date = new Date(now).toLocaleDateString()
        let time = new Date(now).toLocaleTimeString()
        console.log(`\n[${date}, ${time}]`)
      }
    }
    let rehydrate = rehydrator({ debounce, quiet, symlink, ts, update })

    // Toss a coin to your watcher
    let enable = params.watcher === false ? false : true
    let watcher = watch({ debounce, enable, inventory, rehydrate, symlink, ts, update })
    if (watcher) {
      update.done('Started file watcher')
    }

    // Handle stdin
    stdin({ rehydrate, update, watcher }, callback)
  })
}

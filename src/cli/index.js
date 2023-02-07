let sandbox = require('../')
let rehydrator = require('./_rehydrate')
let watch = require('./_watcher')
let stdin = require('./_stdin')
let getFlags = require('./_flags')

module.exports = function cli (options, callback) {
  let flags = getFlags()
  let params = { ...options, ...flags }
  params.quiet = options.quiet || flags.quiet
  sandbox.start(params, function watching (err) {
    if (err) {
      sandbox.end()
      if (callback) callback(err)
      else process.exit(1)
    }
    else if (callback) callback()

    // Setup
    let { quiet, symlink, update } = params
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
    let rehydrate = rehydrator({ debounce, symlink, ts, update })

    // Toss a coin to your watcher
    let enable = params.watcher === false ? false : true
    let watcher = watch({ debounce, enable, rehydrate, ts }, params)
    if (watcher) {
      update.done('File watcher now looking for project changes')
    }

    // Handle stdin
    stdin({ rehydrate, update, watcher })
  })
}

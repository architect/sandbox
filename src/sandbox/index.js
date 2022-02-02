let _inventory = require('@architect/inventory')
let { updater } = require('@architect/utils')
let getFlags = require('./_flags')
let _start = require('./start')
let _end = require('./end')
let update

// We can't reinventory on shutdown as the state of the project may have changed, so we'll stash it in global scope until the next start or refresh
let running = {}

/**
 * Run startup routines and start all services
 */
function start (options, callback) {
  options = options || {}
  let flags = getFlags()
  options.cwd = options.cwd || process.cwd()
  options.update = update = updater('Sandbox', {
    logLevel: options?.logLevel !== undefined ? options.logLevel : flags.logLevel,
    quiet: options?.quiet !== undefined ? options.quiet : flags.quiet,
  })

  // Set up promise if there's no callback
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  function go () {
    // TODO we should probably add some passed option sanitization here
    _start({ ...flags, ...options }, function (err, ports) {
      if (err) callback(err)
      else {
        running.ports = ports
        callback(null, 'Sandbox successfully started')
      }
    })
  }
  if (options.inventory) {
    running.inventory = options.inventory
    go()
  }
  else {
    _inventory({ cwd: options.cwd }, function (err, result) {
      if (err) callback(err)
      else {
        options.inventory = running.inventory = result
        go()
      }
    })
  }

  return promise
}

/**
 * Shut everything down
 */
function end (callback) {
  // Set up promise if there's no callback
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  let { inventory, ports } = running
  if (!inventory || !ports) {
    callback(Error('Sandbox is not running'))
  }
  else {
    _end({ update, inventory, ports }, function (err) {
      if (err) callback(err)
      else {
        running = {}
        callback(null, 'Sandbox successfully shut down')
      }
    })
  }

  return promise
}

module.exports = { start, end }

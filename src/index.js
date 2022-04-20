let _inventory = require('@architect/inventory')
let { updater } = require('@architect/utils')
let { _start, _end } = require('./sandbox')
let update

// We can't reinventory on end as the state of the project may have changed (and this may be a restart), so stash inv + ports in global scope until the next start or refresh
let running = {}

/**
 * Run startup routines and start all services
 */
function start (params, callback) {
  params = params || {}
  // TODO we should probably add some passed option sanitization
  let { logLevel, quiet } = params
  params.cwd = params.cwd || process.cwd()
  params.symlink = params.symlink !== undefined ? params.symlink : true
  params.update = update = updater('Sandbox', { logLevel, quiet })

  // Set up promise if there's no callback
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        // Try terminating services in the event of a failed startup, or Sandbox may hang tests
        if (err) {
          running._startupFailed = true
          try { end(() => rej(err)) }
          catch (e) { rej(err) }
        }
        else res(result)
      }
    })
  }

  function go () {
    _start(params, function (err, ports) {
      if (err) callback(err)
      else {
        running.ports = ports
        callback(null, 'Sandbox successfully started')
      }
    })
  }

  if (params.inventory) {
    running.inventory = params.inventory
    go()
  }
  else {
    _inventory({ cwd: params.cwd }, function (err, result) {
      if (err) callback(err)
      else {
        running.inventory = params.inventory = result
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

  let { inventory, ports, _startupFailed } = running
  if ((!inventory || !ports) && !_startupFailed) {
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

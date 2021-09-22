// Services + start/end
let service = require('./_service-factory')
let _start = require('./start')
let _end = require('./end')

let inv = require('@architect/inventory')
let { getFlags } = require('../lib')
let { updater } = require('@architect/utils')
let { logLevel, quiet } = getFlags()
let update = updater('Sandbox', { logLevel, quiet })

/**
 * Server - contains Sandbox service singletons that can operate independently
 */
let server = {
  events: undefined,
  http:   undefined,
  tables: undefined,
  _arc:   undefined,
}

/**
 * Core Sandbox services
 */
let params = { inventory: null, logLevel, quiet, server, update }
let events = service(params, 'events')
let http =   service(params, 'http')
let tables = service(params, 'tables')
let _arc =   service(params, '_arc')

/**
 * Run startup routines and start all services
 */
function start (options, callback) {
  options = options || {}
  options.cwd = options.cwd || process.cwd()

  update = updater('Sandbox', {
    logLevel: options?.logLevel || logLevel,
    quiet: options?.quiet !== undefined ? options.quiet : quiet,
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
    _start({
      inventory: params.inventory,
      update,
      events,
      http,
      tables,
      _arc,
      server,
      ...options,
    }, callback)
  }
  if (options.inventory) {
    params.inventory = options.inventory
    go()
  }
  else {
    inv({ cwd: options.cwd }, function (err, result) {
      if (err) callback(err)
      else {
        params.inventory = result
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

  if (!params.inventory) {
    callback(Error('Sandbox already shut down!'))
  }
  else {
    _end({ events, http, tables, _arc, inventory: params.inventory }, function (err, result) {
      if (err) callback(err)
      else {
        params.inventory = null
        callback(null, result)
      }
    })
  }

  return promise
}

module.exports = { events, http, tables, _arc, start, end }

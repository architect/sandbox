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
}

/**
 * Core Sandbox services
 */
let events = service({ server, update, logLevel, quiet, type: 'events' })
let http =   service({ server, update, logLevel, quiet, type: 'http' })
let tables = service({ server, update, logLevel, quiet, type: 'tables' })

/**
 * Run startup routines and start all services
 */
function start (options = {}, callback) {
  // Set up promise if there's no callback
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  inv({}, function (err, inventory) {
    if (err) callback(err)
    else {
      update = updater('Sandbox', {
        logLevel: options && options.logLevel || logLevel,
        quiet: options && options.quiet || quiet,
      })

      _start({
        ...options,
        update,
        events,
        http,
        tables,
        inventory,
      }, callback)
    }
  })

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

  inv({}, function (err, inventory) {
    if (err) callback(err)
    else _end({ events, http, inventory, tables }, callback)
  })
  return promise
}

module.exports = { events, http, tables, start, end }

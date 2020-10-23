// Services + start/end
let service = require('./_service-factory')
let _start = require('./start')
let _end = require('./end')

let inv = require('@architect/inventory')
let { updater } = require('@architect/utils')
let update = updater('Sandbox')

/**
 * Server - contains Sandbox service singletons that can operate independently
 */
let server = {
  events: undefined,
  http: undefined,
  tables: undefined,
}

/**
 * Core Sandbox services
 */
let events = service({ server, type: 'events', update })
let http = service({ server, type: 'http', update })
let tables = service({ server, type: 'tables', update })

/**
 * Run startup routines and start all services
 */
function start (args = {}, callback) {
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
      _start({
        ...args,
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
  return _end({ events, http, tables }, callback)
}

module.exports = { events, http, tables, start, end }

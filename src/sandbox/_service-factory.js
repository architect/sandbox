let inv = require('@architect/inventory')
let { updater } = require('@architect/utils')
let _events = require('../events')
let _http = require('../http')
let _tables = require('../tables')
let _arc = require('../arc')

module.exports = function serviceFactory (params) {
  let { server, type, update, logLevel, quiet } = params
  let t = t => type === t
  let init
  if (t('events'))  init = _events
  if (t('http'))    init = _http
  if (t('tables'))  init = _tables
  if (t('_arc'))    init = _arc
  return {
    start: function (options = {}, callback) {
      // Set up promise if there's no callback
      let promise
      if (!callback) {
        promise = new Promise(function (res, rej) {
          callback = function (err, result) {
            err ? rej(err) : res(result)
          }
        })
      }

      // Populate updater with passed options (if any)
      if (options.logLevel || options.quiet) {
        update = updater('Sandbox', {
          logLevel: options && options.logLevel || logLevel,
          quiet: options && options.quiet || quiet,
        })
      }

      inv({}, function (err, inventory) {
        if (err) callback(err)
        else {
          if (!server[type]) {
            let service = init(inventory)
            if (service) {
              options.update = update
              server[type] = service
              server[type].start(options, callback)
            }
            else callback()
          }
          else callback()
        }
      })

      return promise
    },
    end: function (callback) {
      // Set up promise if there's no callback
      let promise
      if (!callback) {
        promise = new Promise(function (res, rej) {
          callback = function (err, result) {
            err ? rej(err) : res(result)
          }
        })
      }

      if (server[type]) {
        server[type].end(callback)
        server[type] = undefined
      }
      else callback()

      return promise
    }
  }
}

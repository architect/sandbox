let inv = require('@architect/inventory')
let _events = require('../events')
let _http = require('../http')
let _tables = require('../tables')

module.exports = function serviceFactory (params) {
  let { server, type, update } = params
  let t = t => type === t
  let init
  if (t('events'))  init = _events
  if (t('http'))    init = _http
  if (t('tables'))  init = _tables
  return {
    start: function (options, callback) {
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

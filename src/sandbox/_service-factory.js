let inv = require('@architect/inventory')
let { updater } = require('@architect/utils')
let _events = require('../events')
let _http = require('../http')
let _tables = require('../tables')
let _arc = require('../arc')

module.exports = function serviceFactory (params, type) {
  let { logLevel, quiet, server, update } = params
  let t = t => type === t
  let init
  if (t('events'))  init = _events
  if (t('http'))    init = _http
  if (t('tables'))  init = _tables
  if (t('_arc'))    init = _arc
  return {
    start: function (options, callback) {
      options = options || {}
      options.cwd = options.cwd || process.cwd()

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
      let hasQuietOpt = options.quiet !== undefined
      if (options.logLevel || hasQuietOpt) {
        update = updater('Sandbox', {
          logLevel: options?.logLevel || logLevel,
          quiet: hasQuietOpt ? options.quiet : quiet,
        })
      }

      function go () {
        if (!server[type]) {
          let service = init(params.inventory)
          if (service) {
            options.update = update
            options.inventory = params.inventory
            server[type] = service
            server[type].start(options, callback)
          }
          else callback()
        }
        else callback()
      }

      if (options._refreshInventory || !params.inventory) {
        // Get it for the first (and hopefully last) time
        inv({ cwd: options.cwd }, function (err, result) {
          if (err) callback(err)
          else {
            params.inventory = result
            // Don't pass along refreshInventory flag to _arc, etc.
            delete options._refreshInventory
            go()
          }
        })
      }
      else go()

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

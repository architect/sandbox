let series = require('run-series')
let { callbackify } = require('util')

module.exports = function end (server, callback) {
  let { events, http, inventory, tables } = server
  let { inv } = inventory

  // Set up promise if there is no callback
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  series([
    function _httpServer (callback) {
      if (http) http.end(callback)
      else callback()
    },
    function _eventBus (callback) {
      if (events) events.end(callback)
      else callback()
    },
    function _dynamo (callback) {
      if (tables) tables.end(callback)
      else callback()
    },
    function _plugins (callback) {
      if (inv.plugins) {
        let pluginServices = Object.values(inv.plugins).
          map(pluginModule => pluginModule.end).
          filter(end => end).
          map(end => {
            // To be compatible with run-series, we can't use async functions.
            // so if plugin author provides an async function, let's callbackify it
            if (end.constructor.name === 'AsyncFunction') return callbackify(end)
            return end
          })
        if (pluginServices.length) {
          series(pluginServices.map(end => end.bind({}, inv._project.arc, inventory, server)), function (err) {
            if (err) callback(err)
            else callback()
          })
        }
        else callback()
      }
      else callback()
    }
  ], function closed (err) {
    if (err) callback(err)
    else {
      callback(null, 'Sandbox successfully shut down')
    }
  })

  return promise
}

let series = require('run-series')
let { callbackify } = require('util')

module.exports = function end (server, callback) {
  let { events, http, tables, _arc, inventory } = server
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
    function _internal (callback) {
      _arc.end(callback)
    },
    function _plugins (callback) {
      if (inv._project.plugins) {
        let pluginServices = Object.values(inv._project.plugins).
          map(pluginModule => pluginModule && pluginModule.sandbox ? pluginModule.sandbox.end : null).
          filter(end => end).
          map(end => {
            // To be compatible with run-series, we can't use async functions.
            // so if plugin author provides an async function, let's callbackify it
            if (end.constructor.name === 'AsyncFunction') return callbackify(end)
            return end
          })
        if (pluginServices.length) {
          series(pluginServices.map(end => end.bind({}, { arc: inv._project.arc, inventory, services: server })), function (err) {
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

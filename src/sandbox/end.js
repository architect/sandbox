let series = require('run-series')

module.exports = function end (server, callback) {
  let { events, http, tables } = server

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
    }
  ], function closed (err) {
    if (err) callback(err)
    else {
      callback(null, 'Sandbox successfully shut down')
    }
  })

  return promise
}

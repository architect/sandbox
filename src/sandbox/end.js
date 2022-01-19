let series = require('run-series')

module.exports = function end (server, callback) {
  let { events, http, tables, _arc, inventory, update } = server
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
      let endPlugins = inv.plugins?._methods?.sandbox?.end
      if (endPlugins) {
        let start = Date.now()
        let plural = endPlugins.length > 1 ? 's' : ''
        update.status(`Running ${endPlugins.length} Sandbox shutdown plugin${plural}`)
        let params = { arc: inv._project.arc, inventory }
        async function runPlugins () {
          for (let plugin of endPlugins) {
            await plugin(params)
          }
        }
        runPlugins()
          .then(() => {
            let finish = Date.now()
            update.done(`Ran Sandbox shutdown plugin${plural} in ${finish - start}ms`)
            callback()
          })
          .catch(callback)
      }
      else callback()
    }
  ], function closed (err) {
    if (err) callback(err)
    else {
      let msg = 'Sandbox successfully shut down'
      callback(null, msg)
    }
  })

  return promise
}

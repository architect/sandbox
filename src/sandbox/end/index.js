let series = require('run-series')
let _arc = require('../../arc')
let http = require('../../http')
let events = require('../../events')
let tables = require('../../tables')

module.exports = function end (params, callback) {
  let { inventory, update } = params
  let { inv } = inventory

  series([
    function (callback) {
      http.end(callback)
    },
    function (callback) {
      events.end(callback)
    },
    function (callback) {
      tables.end(callback)
    },
    function (callback) {
      _arc.end(callback)
    },
    function (callback) {
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
  ], function (err) {
    if (err) callback(err)
    else {
      let msg = 'Sandbox successfully shut down'
      callback(null, msg)
    }
  })
}

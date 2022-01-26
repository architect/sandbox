let { checkRuntimes, env, maybeHydrate } = require('../lib')
let hydrate = require('@architect/hydrate')
let _listener = require('./_listener')
let http = require('http')
let series = require('run-series')

/**
 * Creates an event bus that emulates SNS + SQS and listens for `arc.event.publish` events
 */
module.exports = function createEventBus (inventory) {
  let { inv } = inventory

  if (inv.events || inv.queues) {
    let events = {}
    let eventBus

    events.start = function start (options, callback) {
      let { all, cwd, ports, quiet, symlink = true, update, userEnv } = options

      // Main parameters needed throughout an invocation
      // Note: `env` is passed via module API; userEnv is passed by `events.start`, so both are necessary
      let params = { cwd, env: options.env, inventory, ports, quiet, update, userEnv }

      series([
        // Set up Arc + userland env vars
        function _env (callback) {
          if (!all) env(params, callback)
          else callback()
        },

        // Internal Arc services
        function _internal (callback) {
          if (!all) {
            // eslint-disable-next-line
            let { _arc } = require('../sandbox')
            _arc.start(params, callback)
          }
          else callback()
        },

        function _finalSetup (callback) {
          let listener = _listener.bind({}, params)
          eventBus = http.createServer(listener)
          callback()
        },

        // Let's go!
        function _startServer (callback) {
          let eventsPort = params.ports.events
          eventBus.listen(eventsPort, callback)
        },

        // Loop through functions and see if any need dependency hydration
        function _maybeHydrate (callback) {
          if (!all) maybeHydrate({ cwd, inventory, quiet }, callback)
          else callback()
        },

        // ... then hydrate Architect project files into functions
        function _hydrateShared (callback) {
          if (!all) {
            hydrate.shared({ cwd, inventory, quiet, symlink }, function next (err) {
              if (err) callback(err)
              else {
                update.done('Project files hydrated into functions')
                callback()
              }
            })
          }
          else callback()
        },

        // Check runtime versions
        function _checkRuntimes (callback) {
          if (!all) {
            checkRuntimes(params, callback)
          }
          else callback()
        },
      ],
      function _started (err) {
        if (err) callback(err)
        else {
          update.done('@events and @queues ready on local event bus')
          let msg = 'Event bus successfully started'
          callback(null, msg)
        }
      })
    }

    events.end = function end (callback) {
      series([
        function _eventsEnd (callback) {
          eventBus.close(callback)
        },
        function _arcEnd (callback) {
          // eslint-disable-next-line
          let { _arc } = require('../sandbox')
          _arc.end(callback)
        }
      ], function _eventsEnded (err) {
        if (err) callback(err)
        else {
          let msg = 'Event bus successfully shut down'
          callback(null, msg)
        }
      })
    }

    return events
  }
}

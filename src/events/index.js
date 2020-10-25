let { env, getPorts, checkPort, maybeHydrate } = require('../helpers')
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
      let { all, port, symlink = true, update } = options

      // Set up ports and env vars
      let { eventsPort } = getPorts(port)

      series([
        // Set up Arc + userland env vars
        function _env (callback) {
          if (!all) env({ ...options, inventory }, callback)
          else callback()
        },

        // Ensure the port is free
        function _checkPort (callback) {
          checkPort(eventsPort, callback)
        },

        // Loop through functions and see if any need dependency hydration
        function _maybeHydrate (callback) {
          if (!all) maybeHydrate(inventory, callback)
          else callback()
        },

        // ... then hydrate Architect project files into functions
        function _hydrateShared (callback) {
          if (!all) {
            hydrate.shared({ symlink }, function next (err) {
              if (err) callback(err)
              else {
                update.done('Project files hydrated into functions')
                callback()
              }
            })
          }
          else callback()
        },

        function _finalSetup (callback) {
          let listener = _listener.bind({}, inventory)
          eventBus = http.createServer(listener)
          callback()
        },

        // Let's go!
        function _startServer (callback) {
          eventBus.listen(eventsPort, callback)
        }
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
      eventBus.close(function _closed (err) {
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

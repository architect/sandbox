let { env, maybeHydrate, readArc } = require('../helpers')
let hydrate = require('@architect/hydrate')
let runner = require('./_runner')
let series = require('run-series')

// this is a module global
// so we can run events on key press
let schedulerBus

/**
 * Looks for Scheduled Events and runs them as if they were cloudwatch events:
 */
module.exports = function createSchedule () {
  let { arc } = readArc()

  if (!arc.scheduled) {
    return
  }

  let scheduled = {}

  scheduled.start = function start (options, callback) {
    let { all, update } = options

    series([
      function _env (callback) {
        if (!all) env(options, callback)
        else callback()
      },

      // Loop through functions and see if any need dependency hydration
      function _maybeHydrate (callback) {
        if (!all) maybeHydrate(callback)
        else callback()
      },

      // ... then hydrate Architect project files into functions
      function _hydrateShared (callback) {
        if (!all) {
          hydrate({ install: false }, function next (err) {
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
        try {
          schedulerBus = runner(arc.scheduled, update)
        }
        catch (e) {
          callback(e)
        }

        callback()
      }
    ],

    function _started (err) {
      if (err) callback(err)
      else {
        update.done('@scheduled events are running')
        let msg = 'Scheduler successfully started'
        callback(null, msg)
      }
    })
  }

  scheduled.end = function end (callback) {
    schedulerBus.stop(function _closed (err) {
      if (err) callback(err)
      else {
        let msg = 'Scheduled events shut down'
        callback(null, msg)
      }
    })
  }

  return scheduled
}

module.exports.scheduledEventsRunner = function () {
  schedulerBus && schedulerBus.runEvents()
}

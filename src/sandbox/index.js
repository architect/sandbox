let hydrate = require('@architect/hydrate')
let series = require('run-series')
let create = require('@architect/create')

let env = require('./env')
let ports = require('./ports')
let checkRuntimes = require('./check-runtimes')
let maybeHydrate = require('./maybe-hydrate')
let _arc = require('../arc')
let http = require('../http')
let events = require('../events')
let tables = require('../tables')

let printStatus = require('./print-status')
let plugins = require('./plugins')
let seed = require('./seed')
let startupScripts = require('./startup-scripts')

function _start (params, callback) {
  let start = Date.now()
  let { inventory, restart, symlink, update } = params
  let { inv } = params.inventory

  series([
    // Set up + validate env vars, print the banner
    function (callback) {
      env(params, callback)
    },

    // Get the ports for services
    function (callback) {
      ports(params, callback)
    },

    // Initialize any missing functions on startup
    function (callback) {
      let autocreateEnabled = inv._project.preferences?.create?.autocreate
      if (autocreateEnabled) {
        create(params, callback)
      }
      else callback()
    },

    // Internal Arc services
    function (callback) {
      _arc.start(params, callback)
    },

    // Start DynamoDB (@tables)
    function (callback) {
      tables.start(params, callback)
    },

    // Start event bus (@events) listening for `arc.event.publish` events
    function (callback) {
      events.start(params, callback)
    },

    // Start HTTP + WebSocket (@http, @ws) server
    function (callback) {
      http.start(params, callback)
    },

    // Loop through functions and see if any need dependency hydration
    function (callback) {
      maybeHydrate(params, callback)
    },

    // ... then hydrate Architect project files into functions
    function (callback) {
      let quiet = params.quiet
      if (restart) quiet = true
      hydrate.shared({ inventory, quiet, symlink }, function next (err) {
        if (err) callback(err)
        else {
          if (!restart) update.done('Project files hydrated into functions')
          callback()
        }
      })
    },

    // Pretty print routes, startup time, aws-sdk installatation status, etc.
    function (callback) {
      printStatus(params, start, callback)
    },

    // Check runtime versions
    function (callback) {
      checkRuntimes(params, callback)
    },

    // Kick off any Sandbox startup plugins
    function (callback) {
      let options = { method: 'start', name: 'startup' }
      plugins(params, options, callback)
    },

    // Seed the database
    function (callback) {
      seed(params, callback)
    },

    // Run startup scripts (if present)
    function (callback) {
      startupScripts(params, callback)
    },
  ],
  function (err) {
    if (err) callback(err)
    else {
      if (process.env.ARC_AWS_CREDS === 'dummy' && !restart) {
        update.verbose.warn('Missing or invalid AWS credentials or credentials file, using dummy credentials (this is probably ok)')
      }
      callback(null, params.ports)
    }
  })
}

function _end (params, callback) {
  series([
    function (callback) {
      let options = { method: 'end', name: 'shutdown' }
      plugins(params, options, callback)
    },
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
  ], callback)
}

module.exports = { _start, _end }

let { existsSync: exists } = require('fs')
let { join } = require('path')
let { callbackify } = require('util')
let chalk = require('chalk')
let hydrate = require('@architect/hydrate')
let series = require('run-series')
let create = require('@architect/create')
let { chars } = require('@architect/utils')
let { env, maybeHydrate } = require('../lib')
let startupScripts = require('./_startup-scripts')

module.exports = function _start (params, callback) {
  let start = Date.now()
  let {
    inventory,
    // Settings
    options,
    symlink = true,
    // Everything else
    update,
    events,
    http,
    tables,
    _arc,
  } = params
  let { inv } = inventory
  let { preferences: prefs } = inv._project
  let server = { http, events, tables }

  // Set `all` to instruct service modules not to hydrate again, etc.
  params.all = true

  // Set up verbositude
  let verbose = false
  let findVerbose = option => [ '-v', '--verbose', 'verbose' ].includes(option)
  if (options && options.some(findVerbose)) {
    verbose = true
  }

  let deprecated = process.env.DEPRECATED

  series([
    // Set up Arc + userland env vars + print the banner
    function _env (callback) {
      env(params, callback)
    },

    // Initialize any missing functions on startup
    function _init (callback) {
      let autocreateEnabled = prefs && prefs.create && prefs.create.autocreate
      if (autocreateEnabled && !deprecated) {
        create({}, callback)
      }
      else callback()
    },

    // Loop through functions and see if any need dependency hydration
    function _maybeHydrate (callback) {
      maybeHydrate(inventory, callback)
    },

    // ... then hydrate Architect project files into functions
    function _hydrateShared (callback) {
      hydrate.shared({ symlink }, function next (err) {
        if (err) callback(err)
        else {
          update.done('Project files hydrated into functions')
          callback()
        }
      })
    },

    // Internal Arc services
    function _internal (callback) {
      _arc.start(params, callback)
    },

    // Start DynamoDB (@tables)
    function _tables (callback) {
      tables.start(params, callback)
    },

    // Start event bus (@events) listening for `arc.event.publish` events
    function _events (callback) {
      events.start(params, callback)
    },

    // Start HTTP + WebSocket (@http, @ws) server
    function _http (callback) {
      http.start(params, callback)
    },

    // Kick off any plugin sandbox services
    function _plugins (callback) {
      if (inv._project.plugins) {
        let pluginServices = Object.values(inv._project.plugins).
          map(pluginModule => pluginModule && pluginModule.sandbox ? pluginModule.sandbox.start : null).
          filter(start => start).
          map(start => {
            // To be compatible with run-series, we can't use async functions.
            // so if plugin author provides an async function, let's callbackify it
            if (start.constructor.name === 'AsyncFunction') return callbackify(start)
            return start
          })
        if (pluginServices.length) {
          series(pluginServices.map(start => start.bind({}, { arc: inv._project.arc, inventory, services: server })), function (err) {
            if (err) callback(err)
            else callback()
          })
        }
        else callback()
      }
      else callback()
    },

    // Print startup time
    function _ready (callback) {
      let finish = Date.now()
      update.done(`Started in ${finish - start}ms`)
      let isWin = process.platform.startsWith('win')
      let ready = isWin
        ? chars.done
        : chalk.green.dim('❤︎')
      let readyMsg = chalk.white('Local environment ready!')
      update.raw(`${ready} ${readyMsg}\n`)
      callback()
    },

    // Run startup scripts (if present)
    function _runStartupScripts (callback) {
      startupScripts({ inventory, update }, callback)
    },

    // Check aws-sdk installation status if installed globally
    function _checkAWS_SDK (callback) {
      let cwd = process.cwd()
      let dir = __dirname
      if (!dir.startsWith(cwd)) {
        let awsDir = join(dir.split('@architect')[0], 'aws-sdk', 'package.json')
        if (!exists(awsDir)) {
          update.warn(`Possible global install of Architect without a global install of AWS-SDK, please run: npm i -g aws-sdk`)
        }
      }
      callback()
    }
  ],
  function _done (err) {
    if (err) callback(err)
    else {
      if (verbose && process.env.ARC_AWS_CREDS === 'dummy') {
        update.warn('Missing or invalid AWS credentials or credentials file, using dummy credentials (this is probably ok)')
      }
      callback(null, 'Sandbox successfully started')
    }
  })
}

let { existsSync: exists } = require('fs')
let { join } = require('path')
let { callbackify } = require('util')
let chalk = require('chalk')
let hydrate = require('@architect/hydrate')
let series = require('run-series')
let create = require('@architect/create')
let { chars } = require('@architect/utils')
let { checkRuntimes, env, maybeHydrate } = require('../lib')
let invokePluginFunction = require('../invoke-lambda/_plugin')
let httpConfig = require('../http/_config')
let prettyPrint = require('../http/_pretty-print')
let startupScripts = require('./_startup-scripts')

module.exports = function _start (params, callback) {
  let start = Date.now()
  let {
    inventory,
    // Settings
    apigateway,
    cwd,
    quiet,
    symlink = true,
    // Everything else
    events,
    http,
    tables,
    _arc,
    server,
    update,
  } = params
  let { inv } = inventory
  let { preferences: prefs } = inv._project

  // Set `all` to instruct service modules not to hydrate again, etc.
  params.all = true

  series([
    // Set up Arc + userland env vars + print the banner
    function _env (callback) {
      env(params, function (err, userEnv) {
        if (err) callback(err)
        else {
          params.userEnv = userEnv
          callback()
        }
      })
    },

    // Initialize any missing functions on startup
    function _init (callback) {
      let autocreateEnabled = prefs?.create?.autocreate
      if (autocreateEnabled) {
        create({ inventory }, callback)
      }
      else callback()
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
          map(pluginModule => pluginModule?.sandbox?.start || null).
          filter(start => start).
          map(start => {
            // To be compatible with run-series, we can't use async functions.
            // so if plugin author provides an async function, let's callbackify it
            if (start.constructor.name === 'AsyncFunction') return callbackify(start)
            return start
          })
        if (pluginServices.length) {
          let invokeFunction = invokePluginFunction.bind({}, params)
          series(pluginServices.map(start => start.bind({}, {
            arc: inv._project.arc,
            inventory,
            invokeFunction,
            services: server
          })), function (err) {
            if (err) callback(err)
            else callback()
          })
        }
        else callback()
      }
      else callback()
    },

    // Loop through functions and see if any need dependency hydration
    function _maybeHydrate (callback) {
      maybeHydrate({ cwd, inventory, quiet }, callback)
    },

    // ... then hydrate Architect project files into functions
    function _hydrateShared (callback) {
      hydrate.shared({ cwd, inventory, quiet, symlink }, function next (err) {
        if (err) callback(err)
        else {
          update.done('Project files hydrated into functions')
          callback()
        }
      })
    },

    // Pretty print routes
    function _printRoutes (callback) {
      let { http, ws } = inventory.inv
      if (http || ws) {
        let { apiType } = httpConfig({ apigateway, cwd, inv })
        prettyPrint({ apiType, ...params })
      }
      callback()
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
      startupScripts(params, callback)
    },

    // Check aws-sdk installation status if installed globally
    function _checkAWS_SDK (callback) {
      let dir = __dirname
      if (!dir.startsWith(cwd) && !process.pkg) {
        let awsDir = join(dir.split('@architect')[0], 'aws-sdk', 'package.json')
        if (!exists(awsDir)) {
          update.warn(`Possible global install of Architect without a global install of AWS-SDK, please run: npm i -g aws-sdk`)
        }
      }
      callback()
    },

    // Check runtime versions
    function _checkRuntimes (callback) {
      checkRuntimes(params, callback)
    }
  ],
  function _done (err) {
    if (err) callback(err)
    else {
      if (process.env.ARC_AWS_CREDS === 'dummy') {
        update.verbose.warn('Missing or invalid AWS credentials or credentials file, using dummy credentials (this is probably ok)')
      }
      callback(null, 'Sandbox successfully started')
    }
  })
}

// Built-ins
let http = require('http')

// 3rd party
let Router = require('router')
let finalhandler = require('finalhandler')
let series = require('run-series')
let chalk = require('chalk')

// Local
let { fingerprint } = require('@architect/utils')
let { env, getPorts, checkPort, maybeHydrate } = require('../helpers')
let middleware = require('./middleware')
let httpEnv = require('./_http-env')
let hydrate = require('@architect/hydrate')
let registerHTTP = require('./register-http')
let registerWS = require('./register-websocket')

/**
 * Creates an HTTP + WebSocket server that emulates API Gateway
 */
module.exports = function createHttpServer (inventory) {
  let { inv } = inventory
  let isDefaultProject = !inv._project.manifest
  let arc = inv._project.arc

  if (inv.http) {
    let app = Router({ mergeParams: true })

    app = middleware(app, inventory)

    // Keep a reference up here for fns below
    let httpServer
    let websocketServer

    // Start the HTTP server
    app.start = function start (options, callback) {
      let { all, port, quiet, symlink = true, update } = options

      // Set up ports and HTTP-specific env vars
      let { httpPort } = getPorts(port)
      httpEnv(arc)

      series([
        // Set up Arc + userland env vars
        function _env (callback) {
          if (!all) env({ ...options, inventory }, callback)
          else callback()
        },

        // Ensure the port is free
        function _checkPort (callback) {
          checkPort(httpPort, callback)
        },

        // Generate public/static.json if `@static fingerprint` is enabled
        function _maybeWriteStaticManifest (callback) {
          if (!inv.static || isDefaultProject) callback()
          else fingerprint({ inventory }, function next (err, result) {
            if (err) callback(err)
            else {
              let msg = 'Static asset fingerpringing enabled, public/static.json generated'
              if (result) update.done(msg)
              callback()
            }
          })
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
          // Always register HTTP routes
          registerHTTP({ app, routes: inv.http })

          // Create an actual server; how quaint!
          httpServer = http.createServer(function _request (req, res) {
            app(req, res, finalhandler(req, res))
          })

          // Bind WebSocket app to HTTP server
          if (inv.ws) {
            websocketServer = registerWS({ app, httpServer, inventory })
          }

          callback()
        },

        // Let's go!
        function _startServer (callback) {
          httpServer.listen(httpPort, callback)
        }
      ],
      function _started (err) {
        if (err) callback(err)
        else {
          if (!quiet) {
            let link = chalk.green.bold.underline(`http://localhost:${httpPort}\n`)
            console.log(`\n    ${link}`)
          }
          let msg = 'HTTP successfully started'
          callback(null, msg)
        }
      })
    }

    app.end = function end (callback) {
      series([
        function _http (callback) {
          if (httpServer) httpServer.close(callback)
          else callback()
        },
        function _websocket (callback) {
          if (websocketServer) websocketServer.close(callback)
          else callback()
        },
      ], function _closed (err) {
        if (err) callback(err)
        else {
          let msg = 'HTTP successfully shut down'
          callback(null, msg)
        }
      })
    }

    return app
  }
}

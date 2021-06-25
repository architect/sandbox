// Built-ins
let http = require('http')

// 3rd party
let Router = require('router')
let finalhandler = require('finalhandler')
let series = require('run-series')
let destroyer = require('server-destroy')

// Local
let { fingerprint } = require('@architect/utils')
let { env, getPorts, checkPort, maybeHydrate } = require('../lib')
let middleware = require('./middleware')
let httpEnv = require('./_http-env')
let hydrate = require('@architect/hydrate')
let registerHTTP = require('./register-http')
let registerWS = require('./register-websocket')
let prettyPrint = require('./_pretty-print')

/**
 * Creates an HTTP + WebSocket server that emulates API Gateway
 */
module.exports = function createHttpServer (inventory) {
  let { inv } = inventory
  let isDefaultProject = !inv._project.manifest
  let arc = inv._project.arc

  if (inv.http || inv.static || inv.ws) {
    let app = Router({ mergeParams: true })

    // Keep a reference up here for fns below
    let httpServer
    let websocketServer

    // Start the HTTP server
    app.start = function start (options, callback) {
      let { all, cwd, port, symlink = true, update } = options

      middleware(app, { cwd, inventory, update })

      // Set up ports and HTTP-specific env vars
      let { httpPort } = getPorts(port)
      httpEnv(arc, cwd)

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
              let msg = 'Static asset fingerprinting enabled, public/static.json generated'
              if (result) update.done(msg)
              callback()
            }
          })
        },

        // Internal Arc services
        function _internal (callback) {
          if (!all) {
            // eslint-disable-next-line
            let { _arc } = require('../sandbox')
            _arc.start(options, callback)
          }
          else callback()
        },

        function _finalSetup (callback) {
          // Create an actual server; how quaint!
          httpServer = http.createServer(function _request (req, res) {
            app(req, res, finalhandler(req, res))
          })
          destroyer(httpServer)

          // Bind WebSocket app to HTTP server
          // This must be done before @http so it isn't clobbered by greedy routes
          if (inv.ws) {
            websocketServer = registerWS({ app, cwd, httpServer, inventory, update, httpPort })
          }

          if (inv.http) {
            registerHTTP({ app, cwd, routes: inv.http, inventory, update })
          }

          callback()
        },

        // Let's go!
        function _startServer (callback) {
          httpServer.listen(httpPort, callback)
        },

        // Loop through functions and see if any need dependency hydration
        function _maybeHydrate (callback) {
          if (!all) maybeHydrate({ cwd, inventory }, callback)
          else callback()
        },

        // ... then hydrate Architect project files into functions
        function _hydrateShared (callback) {
          if (!all) {
            hydrate.shared({ cwd, inventory, symlink }, function next (err) {
              if (err) callback(err)
              else {
                update.done('Project files hydrated into functions')
                callback()
              }
            })
          }
          else callback()
        },

        // Pretty print routes
        function _printRoutes (callback) {
          if (!all) {
            prettyPrint({ cwd, inventory, port, update })
            callback()
          }
          else callback()
        },
      ],
      function _started (err) {
        if (err) callback(err)
        else {
          let msg = 'HTTP successfully started'
          callback(null, msg)
        }
      })
    }

    app.end = function end (callback) {
      series([
        function _httpEnd (callback) {
          if (httpServer) httpServer.destroy(callback)
          else callback()
        },
        function _webSocketEnd (callback) {
          if (websocketServer) websocketServer.close(callback)
          else callback()
        },
        function _arcEnd (callback) {
          // eslint-disable-next-line
          let { _arc } = require('../sandbox')
          _arc.end(callback)
        }
      ], function _httpEnded (err) {
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

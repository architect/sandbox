// Built-ins
let http = require('http')

// 3rd party
let Router = require('router')
let finalhandler = require('finalhandler')
let series = require('run-series')
let destroyer = require('server-destroy')

// Local
let { fingerprint } = require('@architect/utils')
let { checkRuntimes, env, getPorts, checkPort, maybeHydrate } = require('../lib')
let middleware = require('./middleware')
let config = require('./_config')
let hydrate = require('@architect/hydrate')
let registerHTTP = require('./register-http')
let registerWS = require('./register-websocket')
let prettyPrint = require('./_pretty-print')
let pool = require('./register-websocket/pool')

/**
 * Creates an HTTP + WebSocket server that emulates API Gateway
 */
module.exports = function createHttpServer (inventory) {
  let { inv } = inventory
  let isDefaultProject = !inv._project.manifest

  if (inv.http || inv.static || inv.ws) {
    let app = Router({ mergeParams: true })

    // Keep a reference up here for fns below
    let httpServer
    let websocketServer

    // Start the HTTP server
    app.start = function start (options, callback) {
      let { all, apigateway, cwd, port, quiet, symlink = true, update, userEnv } = options

      // Set up ports and HTTP-specific config
      let ports = getPorts(port)
      let { httpPort } = ports
      let { apiType, staticPath } = config({ apigateway, cwd, inv })

      // Main parameters needed throughout an invocation
      let params = { apiType, cwd, inventory, ports, staticPath, update, userEnv }

      middleware(app, params)

      series([
        // Set up Arc + userland env vars
        function _env (callback) {
          if (!all) env({ ...options, inventory }, function (err, userEnv) {
            if (err) callback(err)
            else {
              params.userEnv = userEnv
              callback()
            }
          })
          else callback()
        },

        // Ensure the port is free
        function _checkPort (callback) {
          checkPort(httpPort, update, callback)
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
            websocketServer = registerWS(app, httpServer, params)
          }

          if (inv.http) {
            registerHTTP(app, params)
          }

          callback()
        },

        // Let's go!
        function _startServer (callback) {
          httpServer.listen(httpPort, callback)
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

        // Pretty print routes
        function _printRoutes (callback) {
          if (!all) {
            prettyPrint(params)
            callback()
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
          if (websocketServer) {
            websocketServer.close(err => {
              for (let ws of websocketServer.clients) {
                ws.removeAllListeners('close')
                ws.terminate()
              }
              pool.reset()
              if (err) callback(err)
              else callback()
            })
          }
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

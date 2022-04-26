// Built-ins
let http = require('http')

// 3rd party
let Router = require('router')
let finalhandler = require('finalhandler')
let series = require('run-series')
let destroyer = require('server-destroy')

// Local
let { fingerprint } = require('@architect/utils')
let middleware = require('./middleware')
let config = require('./_config')
let registerHTTP = require('./register-http')
let registerWS = require('./register-websocket')
let pool = require('./register-websocket/pool')

// Global refs for .end
let httpServer
let websocketServer

/**
 * Creates an HTTP + WebSocket server that emulates API Gateway
 */
function start (params, callback) {
  let { inventory, restart, update } = params
  let { inv } = inventory

  if (!inv.http && !inv.static && !inv.ws) {
    return callback()
  }

  let app = Router({ mergeParams: true })
  let isDefaultProject = !inv._project.manifest
  let { apiType, staticPath } = config(params)
  if (apiType) params.apiType = apiType
  if (staticPath) params.staticPath = staticPath

  middleware(app, params)

  series([
    // Generate public/static.json if `@static fingerprint` is enabled
    function (callback) {
      if (!inv.static || isDefaultProject) callback()
      else fingerprint({ inventory }, function next (err, result) {
        if (err) callback(err)
        else {
          let msg = 'Static asset fingerprinting enabled, public/static.json generated'
          if (result && !restart) update.done(msg)
          callback()
        }
      })
    },

    // Create an actual server; how quaint!
    function (callback) {
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

      let httpPort = params.ports.http
      httpServer.listen(httpPort, 'localhost', callback)
    }
  ], callback)
}

function end (callback) {
  series([
    // Terminate HTTP
    function (callback) {
      if (httpServer) httpServer.destroy(err => {
        httpServer = undefined
        if (err) callback(err)
        else callback()
      })
      else callback()
    },
    // Terminate WS
    function (callback) {
      if (websocketServer) {
        websocketServer.close(err => {
          for (let ws of websocketServer.clients) {
            ws.removeAllListeners('close')
            ws.terminate()
          }
          pool.reset()
          websocketServer = undefined
          if (err) callback(err)
          else callback()
        })
      }
      else callback()
    },
  ], callback)
}

module.exports = { start, end }

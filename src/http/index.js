// Built-ins
let http = require('http')
let { join } = require('path')

// 3rd party
let Router = require('router')
let body = require('body-parser')
let finalhandler = require('finalhandler')
let series = require('run-series')

// Local
let binary = require('./binary-handler')
let _static = require('./static-path')
let fallback = require('./fallback')
let readArc = require('../sandbox/read-arc')
let registerHTTP = require('./register-http')
let registerWS = require('./register-websocket')

function createHttpServer () {
  // Config arcana
  let jsonTypes = /^application\/.*json/
  let formURLenc = /^application\/x-www-form-urlencoded/
  let isWSsend = req => req.url === '/__arc'
  let limit = '6mb'
  let app = Router({ mergeParams: true })

  // Binary payload / base64 encoding handler
  app.use(binary)

  // Pass along parsed JSON or URL-encoded bodies under certain circumstances
  let parseJson = req => jsonTypes.test(req.headers['content-type']) &&
                         (!req.isBase64Encoded || isWSsend(req)) &&
                         process.env.ARC_API_TYPE !== 'http'
  let parseUrlE = req => formURLenc.test(req.headers['content-type']) &&
                         (!req.isBase64Encoded || isWSsend(req))
  app.use(body.json({ limit, type: parseJson }))
  app.use(body.urlencoded({ limit, type: parseUrlE, extended: false }))

  // Direct static asset delivery via /_static
  app.use(_static)

  // REST `/{proxy+}` & HTTP `$default` greedy catch-alls
  app.use(fallback)

  // Keep a reference up here for fns below
  let server
  let websocket

  // Start the HTTP server
  app.start = function start (callback) {
    let { arc } = readArc()

    // Handle API type
    let defaultApiType = process.env.DEPRECATED ? 'rest' : 'http'
    let findAPIType = s => s[0] && s[0] === 'apigateway' && s[1]
    let arcAPIType = arc.aws && arc.aws.some(findAPIType) && arc.aws.find(findAPIType)[1]
    let apiIsValid = arcAPIType && [ 'http', 'httpv1', 'httpv2', 'rest' ].some(arcAPIType)
    let api = apiIsValid ? arcAPIType : defaultApiType
    process.env.ARC_API_TYPE = process.env.ARC_API_TYPE || api

    // Allow override of 'public' folder
    let staticFolder = tuple => tuple[0] === 'folder'
    let folder = arc.static && arc.static.some(staticFolder) ? arc.static.find(staticFolder)[1] : 'public'
    process.env.ARC_SANDBOX_PATH_TO_STATIC = join(process.cwd(), folder)

    // Always registering http routes (falling back to get / proxy)
    registerHTTP(app, '@http', 'http', arc.http || [])

    // Create an actual server; how quaint!
    server = http.createServer(function _request (req, res) {
      if (process.env.ARC_SANDBOX_ENABLE_CORS) {
        res.setHeader('access-control-allow-origin', '*')
        res.setHeader('access-control-request-method', '*')
        res.setHeader('access-control-allow-methods', 'OPTIONS, GET')
        res.setHeader('access-control-allow-headers', '*')
        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }
      }
      app(req, res, finalhandler(req, res))
    })

    // bind ws
    if (arc.ws) {
      let routes = arc.ws
      websocket = registerWS({ app, server, routes })
    }

    // start listening
    server.listen(process.env.PORT, callback)
  }

  app.close = function close (callback) {
    series([
      function _server (callback) {
        if (server) server.close(callback)
        else callback()
      },
      function _websocket (callback) {
        if (websocket) websocket.close(callback)
        else callback()
      },
    ], function _closed (err) {
      if (err) console.log(err)
      if (callback) callback()
    })
  }

  return app
}

module.exports = createHttpServer

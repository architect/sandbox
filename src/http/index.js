// 3rd party
let Router = require('router')
let body = require('body-parser')
let finalhandler = require('finalhandler')
let readArc = require('@architect/utils/read-arc')

// built ins
let http = require('http')
let join = require('path').join

// local modules
let registerHTTP = require('./register-http')
let registerWS = require('./register-websocket')
let binary = require('./binary-handler')
let publicMiddleware = require('./public-middleware')
let fallback = require('./fallback')

// config arcana
let jsonTypes = /^application\/.*json/
let formURLenc = /^application\/x-www-form-urlencoded/
let limit = '6mb';
let app = Router({mergeParams: true})

app.use(binary)

app.use(body.json({
  limit,
  type: req => jsonTypes.test(req.headers['content-type']) &&
               !req.isBase64Encoded
}))

app.use(body.urlencoded({
  extended: false,
  limit,
  type: req => formURLenc.test(req.headers['content-type']) &&
               !req.isBase64Encoded
}))

app.use(publicMiddleware)
app.use(fallback)

// keep a reference up here for fns below
let server
let websocket

// starts the http server
app.start = function start(callback) {

  // read the arc file
  let web = readArc().arc
  let staticFolder = tuple=> tuple[0] === 'folder'
  let folder = web.static && web.static.some(staticFolder)? web.static.find(staticFolder)[1] : 'public'

  // allow override of 'public' folder
  process.env.ARC_SANDBOX_PATH_TO_STATIC = join(process.cwd(), folder)

  // always registering http routes (falling back to get / proxy)
  registerHTTP(app, '@http', 'http', web.http || [])

  // create an actual server; how quaint!
  server = http.createServer(function _request(req, res) {
    if (process.env.ARC_SANDBOX_ENABLE_CORS) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Request-Method', '*')
      res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET')
      res.setHeader('Access-Control-Allow-Headers', '*')
      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }
    }
    app(req, res, finalhandler(req, res))
  })

  // bind ws
  if (web.ws) {
    let routes = web.ws
    websocket = registerWS({app, server, routes})
  }

  // start listening
  server.listen(process.env.PORT, callback)
  return app
}

app.close = function close() {
  if (server)
    server.close()
  if (websocket)
    websocket.close()
}

// export the app
module.exports = app

let binary = require('./_binary-handler')
let body = require('body-parser')
let _static = require('./_static-path')
let fallback = require('./_fallback')
let cors = require('./_cors')

module.exports = function loadMiddleware (app) {
  // Binary payload / base64 encoding handler
  app.use(binary)

  // Pass along parsed JSON or URL-encoded bodies under certain circumstances
  let jsonTypes = /^application\/.*json/
  let formURLenc = /^application\/x-www-form-urlencoded/
  let isWSsend = req => req.url === '/__arc'
  let limit = '6mb'
  let parseJson = req => jsonTypes.test(req.headers['content-type']) &&
                         (isWSsend(req) || (!req.isBase64Encoded && process.env.ARC_API_TYPE !== 'http'))
  let parseUrlE = req => formURLenc.test(req.headers['content-type']) &&
                         (!req.isBase64Encoded || isWSsend(req))
  app.use(body.json({ limit, type: parseJson }))
  app.use(body.urlencoded({ limit, type: parseUrlE, extended: false }))

  // Direct static asset delivery via /_static
  app.use(_static)

  // Route fallthrough to @proxy + ASAP
  app.use(fallback)

  // Special CORS handling
  app.use(cors)

  return app
}

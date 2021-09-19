let _binary = require('./_binary-handler')
let _parse = require('./_parse')
let _static = require('./_static-path')
let _fallback = require('./_fallback')
let cors = require('./_cors')

module.exports = function loadMiddleware (app, params) {
  let { apiType, staticPath } = params

  // Binary payload / base64 encoding handler
  let binary = _binary.bind({}, { apiType })
  app.use(binary)

  // Sometimes parse JSON or URL-encoded bodies
  _parse(app)

  // Direct static asset delivery via /_static
  let static_ = _static.bind({}, { staticPath })
  app.use(static_)

  // Route fallthrough to @proxy + ASAP
  let fallback = _fallback.bind({}, params)
  app.use(fallback)

  // Special CORS handling
  app.use(cors)
}

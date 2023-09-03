let _binary = require('./_binary-handler')
let _static = require('./_static-path')
let _fallback = require('./_fallback')

module.exports = function loadMiddleware (app, params) {
  let { apiType, inventory, staticPath } = params

  // Binary payload / base64 encoding handler
  let binary = _binary.bind({}, { apiType })
  app.use(binary)

  // Direct static asset delivery via /_static
  let static_ = _static.bind({}, { staticPath, inventory })
  app.use(static_)

  // Route fallthrough to @proxy + ASAP
  let fallback = _fallback.bind({}, params)
  app.use(fallback)
}

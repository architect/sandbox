let _binary = require('./_binary-handler')
let _parse = require('./_parse')
let _static = require('./_static-path')
let _fallback = require('./_fallback')
let cors = require('./_cors')

module.exports = function loadMiddleware (app, { apiType, cwd, inventory, update }) {
  // Binary payload / base64 encoding handler
  let binary = _binary.bind({}, { apiType })
  app.use(binary)

  // Sometimes parse JSON or URL-encoded bodies
  _parse(app)

  // Direct static asset delivery via /_static
  app.use(_static)

  // Route fallthrough to @proxy + ASAP
  let fallback = _fallback.bind({}, { apiType, cwd, inventory, update })
  app.use(fallback)

  // Special CORS handling
  app.use(cors)
}

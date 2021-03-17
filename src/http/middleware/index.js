let binary = require('./_binary-handler')
let parse = require('./_parse')
let _static = require('./_static-path')
let _ard = require('./_resources')
let _fallback = require('./_fallback')
let cors = require('./_cors')

module.exports = function loadMiddleware (app, inventory) {
  // Binary payload / base64 encoding handler
  app.use(binary)

  // Sometimes parse JSON or URL-encoded bodies
  parse(app)

  // Direct static asset delivery via /_static
  app.use(_static)

  // Resource discovery
  let ard = _ard.bind({}, inventory)
  app.use(ard)

  // Route fallthrough to @proxy + ASAP
  let fallback = _fallback.bind({}, inventory)
  app.use(fallback)

  // Special CORS handling
  app.use(cors)

  return app
}

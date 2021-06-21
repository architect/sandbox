let binary = require('./_binary-handler')
let parse = require('./_parse')
let _static = require('./_static-path')
let _asd = require('./_services')
let _fallback = require('./_fallback')
let cors = require('./_cors')

module.exports = function loadMiddleware (app, { cwd, inventory, update }) {
  // Binary payload / base64 encoding handler
  app.use(binary)

  // Sometimes parse JSON or URL-encoded bodies
  parse(app)

  // Direct static asset delivery via /_static
  app.use(_static)

  // Resource discovery
  let asd = _asd.bind({}, inventory)
  app.use(asd)

  // Route fallthrough to @proxy + ASAP
  let fallback = _fallback.bind({}, { cwd, inventory, update })
  app.use(fallback)

  // Special CORS handling
  app.use(cors)
}

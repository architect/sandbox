let http = require('http')
let _listener = require('./_listener')
let destroyer = require('server-destroy')

// Global ref for .end
let _arcServices

/**
 * Internal Architect services, including:
 * - SSM-based service discovery mock
 * - API Gateway v2 Management API
 */
function start (params, callback) {
  let { ports, restart, update } = params

  let listener = _listener.bind({}, params)
  _arcServices = http.createServer(listener)
  _arcServices.listen(ports._arc, err => {
    if (err) callback(err)
    else {
      if (!restart) update.done('Started AWS service emulator')
      destroyer(_arcServices)
      callback()
    }
  })
}

function end (callback) {
  if (_arcServices) _arcServices.destroy(callback)
  else callback()
}

module.exports = { start, end }

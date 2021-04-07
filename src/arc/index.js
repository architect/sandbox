let http = require('http')
let _listener = require('./_listener')

/**
 * Internal Architect services, including:
 * - SSM-based service discovery mock
 */
module.exports = function _internal (inventory) {
  let _arc = {}
  let _arcServices

  _arc.start = function start (options, callback) {
    let { update } = options
    let { ARC_INTERNAL, PORT } = process.env
    ARC_INTERNAL = ARC_INTERNAL || Number(PORT) - 1 // Yeah, it's a magical number, I know

    let listener = _listener.bind({}, { inventory })
    _arcServices = http.createServer(listener)
    _arcServices.listen(ARC_INTERNAL, err => {
      if (err) callback(err)
      else {
        update.done('Started service discovery emulator')
        callback()
      }
    })
  }

  _arc.end = function end (callback) {
    _arcServices.close(callback)
  }

  return _arc
}

let net = require('net')
module.exports = function checkPort (port, fn) {
  let tester = net.createServer()
    .once('error', function (err) {
      if (err) return fn(err)
      fn(null, true)
    })
    .once('listening', function () {
      tester.once('close', function () { fn(null, false) })
        .close()
    })
    .listen(port)
}

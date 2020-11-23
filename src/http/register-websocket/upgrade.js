let http = require('http')
let invoke = require('../invoke-ws')
let Hashid = require('@begin/hashid')
let { updater } = require('@architect/utils')

/**
 * Handle handleshake and possibly return error; note:
 * - In APIGWv2, !2xx responses hang up and return the status code
 * - However, 2xx responses initiate a socket connection (automatically responding with 101)
 */
module.exports = function upgrade (wss, { get }) {
  return function upgrade (req, socket, head) {

    // Get the $connect Lambda
    let lambda = get.ws('connect')

    // Create a connectionId uuid
    let h = new Hashid
    let connectionId = h.encode(Date.now())
    let update = updater('Sandbox')
    update.status('ws/connect: ' + connectionId)

    invoke({
      lambda,
      connectionId,
      req
    },
    function connect (err, res) {
      let statusCode = res && res.statusCode
      if (err || !statusCode || typeof statusCode !== 'number') {
        socket.write(`HTTP/1.1 502 ${http.STATUS_CODES[502]}\r\n\r\n`)
        socket.destroy()
        return
      }
      else if (statusCode >= 200 && statusCode <= 208 || statusCode === 226) {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', connectionId, ws)
        })
      }
      else {
        socket.write(`HTTP/1.1 ${statusCode} ${http.STATUS_CODES[statusCode]}\r\n\r\n`)
        socket.destroy()
        return
      }
    })
  }
}

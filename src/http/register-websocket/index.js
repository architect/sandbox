let WebSocket = require('ws')
let upgrade = require('./upgrade')
let connection = require('./connection')
let sends = require('./send')

module.exports = function registerWebSocket ({ app, server }) {

  let wss = new WebSocket.Server({ noServer: true })

  // listens for HTTP 101 request
  server.on('upgrade', upgrade(wss))

  // listen for the initial web socket connection
  wss.on('connection', connection)

  // listen for arc.ws.send invocations
  app.post('/__arc', sends)

  // so opening context can clean up with wss.close()
  return wss
}

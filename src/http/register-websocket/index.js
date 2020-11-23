let WebSocket = require('ws')
let upgrade = require('./upgrade')
let _connection = require('./connection')
let sends = require('./send')

module.exports = function registerWebSocket ({ app, httpServer, inventory }) {

  let wss = new WebSocket.Server({ noServer: true })

  // Listens for HTTP 101 request
  httpServer.on('upgrade', upgrade(wss, inventory))

  // Listen for the initial WebSocket connection
  let connection = _connection.bind({}, inventory)
  wss.on('connection', connection)

  // Listen for arc.ws.send invocations
  app.post('/__arc', sends)

  return wss
}

let WebSocket = require('ws')
let upgrade = require('./upgrade')
let _connection = require('./connection')
let send = require('./send')

module.exports = function registerWebSocket (params) {
  let { app, cwd, httpServer, inventory, update } = params

  let wss = new WebSocket.Server({ noServer: true })

  // Listens for HTTP 101 request
  httpServer.on('upgrade', upgrade(wss, { cwd, inventory, update }))

  // Listen for the initial WebSocket connection
  let connection = _connection.bind({}, { cwd, inventory, update })
  wss.on('connection', connection)

  // Listen for arc.ws.send invocations
  app.post('/__arc', send)

  return wss
}

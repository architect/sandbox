let WebSocket = require('ws')
let upgrade = require('./upgrade')
let _connection = require('./connection')
let send = require('./send')

module.exports = function registerWebSocket (params) {
  let { app, cwd, httpServer, inventory, update, httpPort } = params

  let wss = new WebSocket.Server({ noServer: true })
  let connectedAt = Date.now()
  let domainName = `localhost:${httpPort}`
  let stage = 'staging'
  // Listens for HTTP 101 request
  httpServer.on('upgrade', upgrade(wss, { cwd, inventory, update, connectedAt, domainName, stage }))

  // Listen for the initial WebSocket connection
  let connection = _connection.bind({}, { cwd, inventory, update, connectedAt, domainName, stage })
  wss.on('connection', connection)

  // Listen for arc.ws.send invocations
  app.post('/__arc', send)

  update.done(`@ws server started`)

  return wss
}

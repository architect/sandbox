let WebSocket = require('ws')
let upgrade = require('./upgrade')
let _connection = require('./connection')
let send = require('./send')

module.exports = function registerWebSocket (params) {
  let { app, cwd, httpServer, inventory, update, httpPort } = params

  let wss = new WebSocket.Server({ noServer: true })
  let domainName = `localhost:${httpPort}`

  // Listens for HTTP 101 request
  httpServer.on('upgrade', upgrade(wss, { cwd, inventory, update, domainName }))

  // Listen for the initial WebSocket connection
  let connection = _connection.bind({}, { cwd, inventory, update, domainName })
  wss.on('connection', connection)

  // Listen for arc.ws.send invocations
  app.post('/__arc', send)

  update.done(`@ws server started`)

  return wss
}

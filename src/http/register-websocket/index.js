let WebSocket = require('ws')
let upgrade = require('./upgrade')
let _connection = require('./connection')

module.exports = function registerWebSocket (app, httpServer, params) {
  let { ports, restart, update } = params

  let wss = new WebSocket.Server({ noServer: true })
  let domainName = `localhost:${ports.http}`

  // Listens for HTTP 101 request
  httpServer.on('upgrade', upgrade(wss, { domainName, ...params }))

  // Listen for the initial WebSocket connection
  let connection = _connection.bind({}, { domainName, ...params })
  wss.on('connection', connection)

  if (!restart) update.done(`@ws server started`)

  return wss
}

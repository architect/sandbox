let http = require('http')
let WebSocket = require('ws')
let join = require('path').join
let invoke = require('./invoke-ws')
let fs = require('fs')
let uuid = require('uuid/v4')

module.exports = function registerWebSocket({app, server}) {

  let wsName = name => process.env.DEPRECATED ? `ws-${name}` : name
  let cwd = name=> join(process.cwd(), 'src', 'ws', wsName(name))
  let wss = new WebSocket.Server({noServer: true})
  let connections = []
  let connectionId // (Re)assigned upon each upgrade request

  // Build paths to default WS Lambdas
  // We're guaranteed that these routes will exist
  let $connect = cwd('connect')
  let $disconnect = cwd('disconnect')
  let $default = cwd('default')


  /**
   * Handle handleshake and possibly return error; note:
   * - In APIGWv2, !2xx responses hang up and return the status code
   * - However, 2xx responses initiate a socket connection (automatically responding with 101)
   */
  server.on('upgrade', async function verify(req, socket, head) {
    // Create a connectionId uuid
    connectionId = uuid()
    connections.push({id: connectionId})

    console.log('\nClient attempting connection, invoking ws/connect')
    invoke({
      action: $connect,
      connectionId,
      req
    }, function connect(err, res) {
      let statusCode = res && res.statusCode
      if (err || !statusCode || typeof statusCode !== 'number') {
        socket.write(`HTTP/1.1 502 ${http.STATUS_CODES[502]}\r\n\r\n`)
        socket.destroy()
        return
      }
      else if (statusCode >= 200 && statusCode <= 208 || statusCode === 226) {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      }
      else {
        socket.write(`HTTP/1.1 ${statusCode} ${http.STATUS_CODES[statusCode]}\r\n\r\n`)
        socket.destroy()
        return
      }
    })
  })

  // Ok, the connection was accepted and the upgrade was completed
  wss.on('connection', function connection(ws) {
    // Be sure to append ws to client's connection
    let id = connections.findIndex(client => client.id === connectionId)
    connections[id].ws = ws

    function noop(err) {
      if (err) console.log(err)
    }
    ws.on('message', function message(msg) {
      let payload = JSON.parse(msg)
      let action = payload.action || null
      let notFound = action === null || !fs.existsSync(cwd(action))
      if (notFound) {
        // invoke src/ws/default
        console.log('\nWebSocket Lambda not found, invoking ws/default')
        invoke({
          action: $default,
          body: msg,
          connectionId
        }, noop)
      }
      else {
        // invoke src/ws/${action}
        console.log(`\nWebSocket Lambda found, invoking ws/${action}`)
        invoke({
          action: cwd(action),
          body: msg,
          connectionId
        }, noop)
      }
    })

    ws.on('close', function close() {
      // invoke src/ws/disconnect
      console.log(`\nWebSocket disconnecting, invoking ws/disconnect`)
      invoke({
        action: $disconnect,
        connectionId,
        req: {headers: {host: `localhost:${process.env.PORT}`}}
      }, noop)
    })
  })

  // create a handler for receiving arc.ws.send messages
  app.post('/__arc', function handle(req, res) {
    let client = connections.find(client=> req.body.id === client.id)
    if (client) {
      try {
        client.ws.send(JSON.stringify(req.body.payload))
      }
      catch(e) {
        console.log('failed to ws.send', e)
      }
      res.statusCode = 200
      res.end('\n')
    }
    else {
      console.log('ws.send client not found')
      res.statusCode = 200
      res.end('\n')
    }
  })

  return wss
}

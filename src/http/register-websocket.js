let WebSocket = require('ws')
let join = require('path').join
let invoke = require('../invoke-lambda')
let fs = require('fs')
let uuid = require('uuid/v4')

module.exports = function registerWebSocket({app, server}) {

  let cwd = name=> join(process.cwd(), 'src', 'ws', name)
  let wss = new WebSocket.Server({server})
  let connections = []

  wss.on('connection', function connection(ws) {

    // build paths to default ws lambdas
    // we're guaranteed that these routes will exist
    let $connect = cwd('connect')
    let $disconnect = cwd('disconnect')
    let $default = cwd('default')

    // create a connectionId uuid
    let connectionId = uuid()
    connections.push({id:connectionId, ws})

    function noop(err) {
      if (err) console.log(err)
    }

    // invoke src/ws/connect w mock payload
    invoke($connect, {
      body: '{}',
      requestContext: {connectionId}
    }, noop)

    ws.on('message', function message(msg) {

      let payload = JSON.parse(msg)
      let action = payload.action || null

      let notFound = action === null || !fs.existsSync(cwd(action))
      if (notFound) {
        // invoke src/ws/default
        console.log('WebSocket Lambda not found, invoking ws/default')
        invoke($default, {
          body: msg,
          requestContext: {connectionId}
        }, noop)
      }
      else {
        // invoke src/ws/${action}
        console.log(`WebSocket lambda found, invoking ws/${action}`)
        invoke(cwd(action), {
          body: msg,
          requestContext: {connectionId}
        }, noop)
      }
    })

    ws.on('close', function close() {
      // invoke src/ws/disconnect
      invoke($disconnect, {
        body: '{}',
        requestContext: {connectionId}
      }, noop)
    })
  })

  // create a handler for receiving arc.ws.send messages
  app.post('/__arc', function handle(req, res) {
    // If body comes in as Base64 encoded, we have to decode and then JSON parse
    // since the router plugins would have skipped the JSON parsing of the body
    let body = req.isBase64Encoded
      ? JSON.parse(new Buffer(req.body, "base64").toString("ascii"))
      : req.body
      
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

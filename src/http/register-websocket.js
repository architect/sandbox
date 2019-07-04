let WebSocket = require('ws')
let join = require('path').join
let invoke = require('../invoke-lambda')
let fs = require('fs')
let uuid = require('uuid/v4')

let paths = {
  original: ['ws-connect', 'ws-disconnect', 'ws-default'],
  classic: ['ws-$connect', 'ws-$disconnect', 'ws-$default'],
  clean: ['connect', 'disconnect', 'default']
}

module.exports = function registerWebSocket({app, server}) {

  let cwd = name=> join(process.cwd(), 'src', 'ws', name)
  let choice = fs.existsSync(cwd('connect')) ? 'clean' : (fs.existsSync(cwd('ws-connect'))? 'original' : 'classic')
  let wss = new WebSocket.Server({server})
  let connections = []

  wss.on('connection', function connection(ws) {

    // build paths to default ws lambdas
    // we're guaranteed that these routes will exist
    let $connect = cwd(paths[choice][0])
    let $disconnect = cwd(paths[choice][1])
    let $default = cwd(paths[choice][2])

    // create a connectionId uuid
    let connectionId = uuid()
    connections.push({id:connectionId, ws})

    function noop(err) {
      if (err) console.log(err)
    }

    // invoke src/ws/ws-$connect w mock payload
    invoke($connect, {
      body: '{}',
      requestContext: {connectionId}
    }, noop)

    ws.on('message', function message(msg) {

      let payload = JSON.parse(msg)
      let action = payload.action || null
      let localAction = `ws-${action}`

      let notFound = action === null || (!fs.existsSync(cwd(localAction)) && !fs.existsSync(cwd(action)))
      if (notFound) {
        // invoke src/ws/ws-$default
        console.log('lambda not found, invoking $default route')
        invoke($default, {
          body: msg,
          requestContext: {connectionId}
        }, noop)
      }
      else if (fs.existsSync(cwd(action))) {
        // invoke src/ws/${action}
        console.log(`lambda found, routing to ${action}`)
        invoke(cwd(action), {
          body: msg,
          requestContext: {connectionId}
        }, noop)
      }
      else {
        // invoke src/ws/ws-${action}
        console.log(`lambda found, routing to ${localAction}`)
        invoke(cwd(localAction), {
          body: msg,
          requestContext: {connectionId}
        }, noop)
      }
    })

    ws.on('close', function close() {
      // invoke src/ws/ws-$disconnect
      invoke($disconnect, {
        body: '{}',
        requestContext: {connectionId}
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

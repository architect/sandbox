let fs = require('fs')
let invoke = require('../invoke-ws')
let pool = require('./pool')
let getPath = require('./get-path')
let noop = err => err? console.log(err): ''

module.exports = function connection(ws, wss) {

  //console.log('connection event called', ws, req)

  let $default = getPath('default')
  let $disconnect = getPath('disconnect')
  let quiet = process.env.ARC_QUIET
  let connectionId = 'wot mate'

  pool.connect(ws, wss)

  ws.on('message', function message(msg) {

    let payload = JSON.parse(msg)
    let action = payload.action || null
    let notFound = action === null || fs.existsSync(getPath(action)) === false
    if (notFound) {
      // invoke src/ws/default
      if (!quiet) {
        console.log('\nInvoking ws/default WebSocket Lambda')
      }
      invoke({
        action: $default,
        body: msg,
        connectionId
      }, noop)
    }
    else {
      // invoke src/ws/${action}
      if (!quiet) {
        console.log(`\nInvoking ws/${action} WebSocket Lambda`)
      }
      invoke({
        action: getPath(action),
        body: msg,
        connectionId
      }, noop)
    }
  })

  ws.on('close', function close() {
    // invoke src/ws/disconnect
    if (!quiet) {
      console.log(`\nInvoking ws/disconnect WebSocket Lambda`)
    }
    invoke({
      action: $disconnect,
      connectionId,
      req: {headers: {host: `localhost:${process.env.PORT}`}}
    }, noop)
  })
}

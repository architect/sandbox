let fs = require('fs')
let invoke = require('../invoke-ws')
let pool = require('./pool')
let getPath = require('./get-path')
let noop = err => err ? console.log(err) : ''
let { updater } = require('@architect/utils')

module.exports = function connection (connectionId, ws) {

  // save this for send to use
  pool.register(connectionId, ws)

  let $default = getPath('default')
  let $disconnect = getPath('disconnect')
  let update = updater('Sandbox')

  ws.on('message', function message (msg) {

    let payload = JSON.parse(msg)
    let action = payload.action || null
    let notFound = action === null || fs.existsSync(getPath(action)) === false
    if (notFound) {
      update.status('ws/default: ' + connectionId)
      invoke({
        action: $default,
        body: msg,
        connectionId
      }, noop)
    }
    else {
      update.status(`ws/${action}: ${connectionId}`)
      invoke({
        action: getPath(action),
        body: msg,
        connectionId
      }, noop)
    }
  })

  ws.on('close', function close () {
    update.status(`ws/disconnect: ${connectionId}`)
    invoke({
      action: $disconnect,
      connectionId,
      req: { headers: { host: `localhost:${process.env.PORT}` } }
    }, noop)
  })
}

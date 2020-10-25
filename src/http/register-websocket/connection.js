let invoke = require('../invoke-ws')
let pool = require('./pool')
let noop = err => err ? console.log(err) : ''
let { updater } = require('@architect/utils')

module.exports = function connection ({ get }, connectionId, ws) {
  // Save this for send to use
  pool.register(connectionId, ws)

  let $default = get.ws('default').src
  let $disconnect = get.ws('disconnect').src
  let update = updater('Sandbox')

  ws.on('message', function message (msg) {
    let payload = JSON.parse(msg)
    let action = payload.action && get.ws(payload.action)
    if (action) {
      update.status(`ws/${action}: ${connectionId}`)
      invoke({
        action: action.src,
        body: msg,
        connectionId
      }, noop)
    }
    else {
      update.status('ws/default: ' + connectionId)
      invoke({
        action: $default,
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

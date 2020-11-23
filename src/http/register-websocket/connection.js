let invoke = require('../invoke-ws')
let pool = require('./pool')
let noop = err => err ? console.log(err) : ''
let { updater } = require('@architect/utils')

module.exports = function connection ({ get }, connectionId, ws) {
  // Save this for send to use
  pool.register(connectionId, ws)
  let update = updater('Sandbox')

  ws.on('message', function message (msg) {
    let payload = JSON.parse(msg)
    let lambda = payload.action && get.ws(payload.action)
    if (lambda) {
      update.status(`ws/${lambda.name}: ${connectionId}`)
      invoke({
        lambda,
        body: msg,
        connectionId
      }, noop)
    }
    else {
      let lambda = get.ws('default')
      update.status('ws/default: ' + connectionId)
      invoke({
        lambda,
        body: msg,
        connectionId
      }, noop)
    }
  })

  ws.on('close', function close () {
    let lambda = get.ws('disconnect')
    update.status(`ws/disconnect: ${connectionId}`)
    invoke({
      lambda,
      connectionId,
      req: { headers: { host: `localhost:${process.env.PORT}` } }
    }, noop)
  })
}

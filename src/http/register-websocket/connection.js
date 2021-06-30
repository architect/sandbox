let makeRequestId = require('../../lib/request-id')
let invoke = require('../invoke-ws')
let pool = require('./pool')
let noop = err => err ? console.log(err) : ''

module.exports = function connection ({ cwd, inventory, update, connectedAt, domainName }, connectionId, ws) {
  let { get } = inventory
  // Save this for send to use
  pool.register(connectionId, ws)

  ws.on('message', function message (msg) {
    let lambda
    try {
      let payload = JSON.parse(msg)
      lambda = payload.action && get.ws(payload.action)
    }
    catch (e) {
      // fallback to default
    }
    if (lambda) {
      update.status(`ws/${lambda.name}: ${connectionId}`)
      let additionalRequestContext = {
        messageId: makeRequestId(),
      }
      invoke({
        cwd,
        lambda,
        body: msg,
        inventory,
        update,
        connectedAt,
        connectionId,
        domainName,
        eventType: 'MESSAGE', // just a guess, I'm not sure
        routeKey: `$${lambda.name}`,
        additionalRequestContext,
      }, noop)
    }
    else {
      let lambda = get.ws('default')
      update.status('ws/default: ' + connectionId)
      let additionalRequestContext = {
        messageId: makeRequestId(),
      }
      invoke({
        cwd,
        lambda,
        body: msg,
        inventory,
        update,
        connectedAt,
        connectionId,
        domainName,
        eventType: 'MESSAGE',
        routeKey: '$default',
        additionalRequestContext
      }, noop)
    }
  })

  ws.on('close', function close () {
    let additionalRequestContext = {
      disconnectReason: '',
    }

    let lambda = get.ws('disconnect')
    update.status(`ws/disconnect: ${connectionId}`)
    invoke({
      cwd,
      lambda,
      req: { headers: { host: `localhost:${process.env.PORT}` } },
      inventory,
      update,
      connectedAt,
      connectionId,
      domainName,
      eventType: 'DISCONNECT',
      routeKey: '$disconnect',
      additionalRequestContext
    }, noop)
  })
}

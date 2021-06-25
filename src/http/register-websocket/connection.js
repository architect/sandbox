let makeRequestId = require('../../lib/request-id')
let invoke = require('../invoke-ws')
let pool = require('./pool')
let noop = err => err ? console.log(err) : ''

module.exports = function connection ({ cwd, inventory, update, connectedAt }, connectionId, ws) {
  let { get } = inventory
  // Save this for send to use
  pool.register(connectionId, ws)

  ws.on('message', function message (msg) {
    let commonRequestContext = {
      messageId: makeRequestId(),
      messageDirection: 'IN',
      connectedAt,
      requestTimeEpoch: Date.now(),
      requestId: makeRequestId(),
      connectionId,
    }
    let lambda
    try {
      const payload = JSON.parse(msg)
      lambda = payload.action && get.ws(payload.action)
    }
    catch (e) {
      // fallback to default
    }
    if (lambda) {
      update.status(`ws/${lambda.name}: ${connectionId}`)
      let requestContext = {
        routeKey: `$${lambda.name}`,
        eventType: 'MESSAGE', // just a guess, I'm not sure
        ...commonRequestContext,
      }
      invoke({
        cwd,
        lambda,
        body: msg,
        requestContext,
        inventory,
        update,
      }, noop)
    }
    else {
      let lambda = get.ws('default')
      update.status('ws/default: ' + connectionId)
      let requestContext = {
        routeKey: '$disconnect',
        eventType: 'DISCONNECT',
        ...commonRequestContext,
      }
      invoke({
        cwd,
        lambda,
        body: msg,
        requestContext,
        inventory,
        update,
      }, noop)
    }
  })

  ws.on('close', function close () {
    let requestContext = {
      routeKey: '$disconnect',
      eventType: 'DISCONNECT',
      messageDirection: 'IN',
      disconnectReason: '',
      connectedAt,
      requestTimeEpoch: Date.now(),
      requestId: makeRequestId(),
      connectionId,
    }

    let lambda = get.ws('disconnect')
    update.status(`ws/disconnect: ${connectionId}`)
    invoke({
      cwd,
      lambda,
      requestContext,
      req: { headers: { host: `localhost:${process.env.PORT}` } },
      inventory,
      update,
    }, noop)
  })
}

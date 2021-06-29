let makeRequestId = require('../../lib/request-id')
let invoke = require('../invoke-ws')
let pool = require('./pool')
let noop = err => err ? console.log(err) : ''

module.exports = function connection ({ cwd, inventory, update, connectedAt, domainName, stage }, connectionId, ws) {
  let { get } = inventory
  // Save this for send to use
  pool.register(connectionId, ws)

  let makeRequestContext = (extra) => ({
    messageId: makeRequestId(),
    messageDirection: 'IN',
    connectedAt,
    requestTimeEpoch: Date.now(),
    requestId: makeRequestId(),
    connectionId,
    domainName,
    stage,
    ...extra
  })

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
      let requestContext = makeRequestContext({
        routeKey: `$${lambda.name}`,
        eventType: 'MESSAGE', // just a guess, I'm not sure
      })
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
      let requestContext = makeRequestContext({
        routeKey: '$default',
        eventType: 'MESSAGE',
      })
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
    let requestContext = makeRequestContext({
      routeKey: '$disconnect',
      eventType: 'DISCONNECT',
      disconnectReason: '',
    })

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

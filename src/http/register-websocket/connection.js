let invoke = require('../invoke-ws')
let pool = require('./pool')
let noop = err => err ? console.log(err) : ''

module.exports = function connection (params, connectionId, ws) {
  let { domainName, inventory, update } = params
  let { get } = inventory
  // Save this for send to use
  pool.register(connectionId, ws)

  const respondToError = (err, resp) => {
    if (err || resp && resp.statusCode >= 400) {
      ws.send(JSON.stringify({ 'message': 'Internal server error', connectionId, 'requestId': 'xxxxxx=' }), noop)
    }
  }

  ws.on('message', function message (data, isBinary) {
    let msg = isBinary ? data : data.toString()
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
      invoke({
        body: msg,
        connectionId,
        lambda,
        ...params,
      }, respondToError)
    }
    else {
      let lambda = get.ws('default')
      update.status('ws/default: ' + connectionId)
      invoke({
        body: msg,
        connectionId,
        lambda,
        ...params,
      }, respondToError)
    }
  })

  ws.on('close', function close () {
    let lambda = get.ws('disconnect')
    update.status(`ws/disconnect: ${connectionId}`)
    let connectedAt = pool.getConnectedAt(connectionId)
    pool.delete(connectionId)
    invoke({
      connectedAt,
      connectionId,
      lambda,
      req: { headers: { host: domainName } },
      ...params,
    }, noop)
  })
}

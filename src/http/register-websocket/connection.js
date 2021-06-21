let invoke = require('../invoke-ws')
let pool = require('./pool')
let noop = err => err ? console.log(err) : ''

module.exports = function connection ({ cwd, inventory, update }, connectionId, ws) {
  let { get } = inventory

  // Save this for send to use
  pool.register(connectionId, ws)

  ws.on('message', function message (msg) {
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
      invoke({
        cwd,
        lambda,
        body: msg,
        connectionId,
        inventory,
        update,
      }, noop)
    }
    else {
      let lambda = get.ws('default')
      update.status('ws/default: ' + connectionId)
      invoke({
        cwd,
        lambda,
        body: msg,
        connectionId,
        inventory,
        update,
      }, noop)
    }
  })

  ws.on('close', function close () {
    let lambda = get.ws('disconnect')
    update.status(`ws/disconnect: ${connectionId}`)
    invoke({
      cwd,
      lambda,
      connectionId,
      req: { headers: { host: `localhost:${process.env.PORT}` } },
      inventory,
      update,
    }, noop)
  })
}

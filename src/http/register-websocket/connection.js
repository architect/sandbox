let fs = require('fs')
let invoke = require('../invoke-ws')
let pool = require('./pool')
let getPath = require('./get-path')
let noop = err => err? console.log(err): ''

module.exports = function connection(connectionId, ws) {

  // save this for send to use
  pool.register(connectionId, ws)

  let $default = getPath('default')
  let $disconnect = getPath('disconnect')
  let quiet = process.env.ARC_QUIET

  ws.on('message', function message(msg) {

    let payload = JSON.parse(msg)
    let action = payload.action || null
    let notFound = action === null || fs.existsSync(getPath(action)) === false
    if (notFound) {
      if (!quiet) {
        console.log('\nws/default:' + connectionId)
      }
      invoke({
        action: $default,
        body: msg,
        connectionId
      }, noop)
    }
    else {
      if (!quiet) {
        console.log(`\nws/${ action }: ${ connectionId }`)
      }
      invoke({
        action: getPath(action),
        body: msg,
        connectionId
      }, noop)
    }
  })

  ws.on('close', function close() {
    if (!quiet) {
      console.log(`\nws/disconnect: ${ connectionId }`)
    }
    invoke({
      action: $disconnect,
      connectionId,
      req: {headers: {host: `localhost:${process.env.PORT}`}}
    }, noop)
  })
}

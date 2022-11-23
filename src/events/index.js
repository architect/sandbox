let _listener = require('./_listener')
let http = require('http')

// Global ref for .end
let eventBus

/**
 * Creates an event bus that emulates SNS + SQS and listens for `arc.event.publish` events
 */
function start (params, callback) {
  let { inventory, ports, host, update } = params
  let { inv } = inventory

  if (!inv.events && !inv.queues) {
    return callback()
  }

  let listener = _listener.bind({}, params)
  eventBus = http.createServer(listener)
  // Node.js 17+ changed DNS lookup behavior for host binding; prefer host to be undefined unless manually specified
  eventBus.listen(ports.events, host, err => {
    if (err) callback(err)
    else {
      update.done('@events and @queues ready on local event bus')
      callback()
    }
  })
}

function end (callback) {
  if (eventBus) eventBus.close(err => {
    eventBus = undefined
    if (err) callback(err)
    else callback()
  })
  else callback()
}

module.exports = { start, end }

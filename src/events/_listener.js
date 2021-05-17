let invoke = require('../invoke-lambda')

module.exports = function eventBusListener ({ inventory, update }, req, res) {
  let { get } = inventory
  let { url } = req
  let body = ''

  function end (name) {
    update.err('@event bus 404 for URL: ' + url)
    if (name) update.err('Event name: ' + name)
    res.statusCode = 404
    res.end('Not found')
    return
  }

  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', () => {
    let message

    try {
      message = JSON.parse(body)
    }
    catch (e) {
      res.statusCode = 400
      res.end('Sandbox @event bus exception parsing request body')
      return
    }

    message.inventory = inventory

    // @queues
    if (url === '/queues') {
      message.arcType = 'queue'
      message.lambda = get.queues(message.name)
    }
    // @events
    else if (url === '/events' || url === '/') {
      message.arcType = 'event'
      message.lambda = get.events(message.name)
    }
    // Who knows
    else end(message.name)

    let { arcType, name, lambda, payload } = message
    update.status(`@${arcType} ${name} received event`)

    if (!message.lambda) {
      end(name)
    }
    else {
      function mock () {
        switch (arcType) {
        case 'event':
          return { Records: [ { Sns: { Message: JSON.stringify(payload) } } ] } // this is fine
        case 'queue':
          return { Records: [ { body: JSON.stringify(payload) } ] } // also fine
        default:
          throw ReferenceError('Unrecognized event type ' + arcType)
        }
      }

      let event = mock()
      invoke({ lambda, event, inventory, update }, function snap (err) {
        if (err && err.message === 'lambda_not_found') {
          update.warn(
            `@${arcType} ${name} missing Lambda handler file\n` +
            `Please create a handler file, or run [npx] arc init, or add 'autocreate true' to your project preferences file's '@create' pragma`
          )
        }
        else if (err) {
          update.status(`@${arcType} ${name} failed with ${err.stack}`)
        }
        else {
          update.status(`@${arcType} ${name} completed`)
        }
      })

      res.statusCode = 200
      res.end('ok')
    }
  })
}

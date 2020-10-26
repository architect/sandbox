let { fork } = require('child_process')
let { join } = require('path')
let chalk = require('chalk')

module.exports = function eventBusListener (inventory, req, res) {
  let { get } = inventory
  let { url } = req
  let quiet = process.env.ARC_QUIET
  let body = ''

  function end (name) {
    let err = str => console.log(chalk.red.dim(str))
    err('Local event bus 404 for URL: ' + url)
    if (name) err('Event name: ' + name)
    res.statusCode = 404
    res.end('Not found')
    return
  }

  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', () => {
    let message = JSON.parse(body)

    // @queues
    if (url === '/queues') {
      message.arcType = 'queue'
      let queue = get.queues(message.name)
      message.lambda = queue
    }
    // @events
    else if (url === '/events' || url === '/') {
      message.arcType = 'event'
      let event = get.events(message.name)
      message.lambda = event
    }
    // Who knows
    else end

    if (!quiet) {
      let cleanup = JSON.stringify(JSON.parse(body), null, 2)
      console.log(chalk.grey.dim('@' + message.arcType), chalk.green.dim(cleanup))
    }

    if (!message.lambda) {
      end(message.name)
    }
    else {
      // Spawn a fork of the Node process
      let subprocess = fork(join(__dirname, '_subprocess.js'))
      subprocess.send(message)
      subprocess.on('message', function _message (msg) {
        if (!quiet) {
          console.log(chalk.grey.dim(msg.text))
        }
      })
      res.statusCode = 200
      res.end('ok')
    }
  })
}

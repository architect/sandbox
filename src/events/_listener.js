let { fork } = require('child_process')
let { join } = require('path')
let chalk = require('chalk')

module.exports = function eventBusListener (req, res) {
  let { url } = req
  let quiet = process.env.ARC_QUIET
  let body = ''

  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', () => {
    let message = JSON.parse(body)

    // @queues
    if (url === '/queues') {
      message.arcType = 'queue'
    }
    // @events
    else if (url === '/events' || url === '/') {
      message.arcType = 'event'
    }
    // Who knows
    else {
      res.statusCode = 404
      res.end('not found')
      if (!quiet) {
        console.log(chalk.red.dim('event bus 404 for URL ' + url))
      }
      return
    }

    if (!quiet) {
      let cleanup = JSON.stringify(JSON.parse(body), null, 2)
      console.log(chalk.grey.dim('@' + message.arcType), chalk.green.dim(cleanup))
    }

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
  })
}

let readArc = require('../sandbox/read-arc')
let fork = require('child_process').fork
let path = require('path')
let http = require('http')
let chalk = require('chalk')

module.exports = { start }

/**
 * Creates a little web server that listens for events
 */
function start (callback) {
  let { arc } = readArc()
  let quiet = process.env.ARC_QUIET
  function close (callback) {
    if (callback) callback()
  }

  if (arc.events || arc.queues) {
    let server = http.createServer(function listener (req, res) {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      req.on('end', () => {
        let message = JSON.parse(body)
        if (req.url === '/queues') {
          message.arcType = 'queue'
        }
        else if (req.url === '/events' || req.url === '/') {
          message.arcType = 'event'
        }
        else {
          res.statusCode = 404
          res.end('not found')
          if (!quiet) {
            console.log(chalk.red.dim('event bus 404 for URL ' + req.url))
          }
          return
        }
        if (!quiet) {
          console.log(chalk.grey.dim('@' + message.arcType), chalk.green.dim(JSON.stringify(JSON.parse(body), null, 2)))
        }
        // spawn a fork of the node process
        let subprocess = fork(path.join(__dirname, '_subprocess.js'))
        subprocess.send(message)
        subprocess.on('message', function _message (msg) {
          if (!quiet) {
            console.log(chalk.grey.dim(msg.text))
          }
        })
        res.statusCode = 200
        res.end('ok')
      })
    })
    // start listening on 3334
    let port = process.env.ARC_EVENTS_PORT || 3334
    server.listen(port, callback ? callback : x => !x)

    return {
      close: function (callback) {
        server.close(callback)
      }
    }
  }
  else {
    callback()
    return { close }
  }
}

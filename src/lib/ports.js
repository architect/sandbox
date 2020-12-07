let net = require('net')

/**
 * Set up ports (and port-related env vars) for Sandbox services
 * - Note: this may be run many times during a single process!
 */
function getPorts (port) {
  let { PORT, ARC_EVENTS_PORT, ARC_TABLES_PORT } = process.env

  // CLI config (which are passed to this fn) > env var config
  let httpPort = port || Number(PORT) || 3333
  let eventsPort = Number(ARC_EVENTS_PORT) || httpPort + 1
  let tablesPort = Number(ARC_TABLES_PORT) || 5000

  // Always set main HTTP / WebSocket port env vars
  process.env.PORT = httpPort
  process.env.ARC_WSS_URL = `ws://localhost:${httpPort}`

  // Port was reconfigured by the user
  let userSetPort = httpPort !== 3333

  // Set non-conflicting service ports for running multiple simultaneous Architect projects
  // Only set events / tables port env vars if necessary; rely on consumers to use known defaults
  if (userSetPort && !ARC_EVENTS_PORT) {
    eventsPort = process.env.ARC_EVENTS_PORT = httpPort + 1
  }
  if (userSetPort && !ARC_TABLES_PORT) {
    tablesPort = process.env.ARC_TABLES_PORT = httpPort + 2
  }

  // Validate
  let notNum = e => e && isNaN(e)
  if (notNum(eventsPort) ||
      notNum(tablesPort) ||
      notNum(httpPort)) {
    throw ReferenceError('Ports must be numbers')
  }

  return {
    httpPort,
    eventsPort,
    tablesPort
  }
}

/**
 * Ensure we have access to the desired HTTP port
 */
function checkPort (port, callback) {
  let tester = net.createServer()
  tester.listen(port)
  tester.once('error', err => {
    if (err.message.includes('EADDRINUSE')) {
      err = Error(`Port ${port} is already in use, cannot start Sandbox`)
    }
    throw err
  })
  tester.once('listening', () => {
    tester.close(callback)
  })
}

module.exports = {
  getPorts,
  checkPort
}

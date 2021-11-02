let net = require('net')
let os = require('os')

let montereyPorts = [ 5000, 7000 ]

/**
 * Set up ports for Sandbox services, but does NOT mutate env vars
 * - Note: this may be run many times during a single process!
 */
function getPorts (port) {
  let { PORT, ARC_EVENTS_PORT, ARC_TABLES_PORT, ARC_INTERNAL } = process.env

  // CLI config (which are passed to this fn) > env var config
  let httpPort = Number(port) || Number(PORT) || 3333
  let eventsPort = Number(ARC_EVENTS_PORT) || httpPort + 1
  let tablesPort = Number(ARC_TABLES_PORT) || 5000
  let _arcPort = Number(ARC_INTERNAL) || httpPort - 1

  // Port was reconfigured by the user
  let userSetPort = httpPort !== 3333

  // Set non-conflicting service ports for running multiple simultaneous Architect projects
  // Only set events / tables port env vars if necessary; rely on consumers to use known defaults
  if (userSetPort && !ARC_EVENTS_PORT) {
    eventsPort = httpPort + 1
  }
  if (userSetPort && !ARC_TABLES_PORT) {
    tablesPort = httpPort + 2
  }

  // Validate
  let notNum = e => e && isNaN(e)
  if (notNum(httpPort) ||
      notNum(eventsPort) ||
      notNum(tablesPort) ||
      notNum(_arcPort)) {
    throw ReferenceError('Ports must be numbers')
  }

  return {
    httpPort,
    eventsPort,
    tablesPort,
    _arcPort,
  }
}

/**
 * Ensure we have access to the desired HTTP port
 */
function checkPort (port, update, callback) {
  _warnIfMonterey(port, update)
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

/**
 * MacOS Monterey Warning
 *
 * Warn users that some ports are now used by the Mac Operating System
 */
function _warnIfMonterey (port, update) {
  if (montereyPorts.includes(port) && os.type().toLowerCase() === 'darwin') {
    const isMonterey = parseInt(os.release().split('.')[0]) >= 21
    if (isMonterey){
      update.warn(`
      You are running a macOS Monterey or later.
      These versions of macOS are known to run processes on port ${port}.

      Sandbox may be unable to start due to port ${port} already being in use.
      Please set the ARC_TABLES_PORT environment variable to an unused port number.`)
    }
  }
}

module.exports = {
  getPorts,
  checkPort
}

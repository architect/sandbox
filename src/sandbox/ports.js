let series = require('run-series')
let net = require('net')
let n = idk => Number(idk)

/**
 * Set up ports for Sandbox services
 * Default HTTP port of 3333 should be considered fixed, while all others can change as necessary
 */
module.exports = function getPorts (params, callback) {
  let { port, /* ports, */ inventory, update } = params
  let { inv } = inventory
  let { manifest, preferences } = inv._project
  let prefs = preferences?.sandbox?.ports
  let {
    ARC_HTTP_PORT, PORT,
    ARC_EVENTS_PORT,
    ARC_TABLES_PORT, ARC_DB_EXTERNAL,
    ARC_INTERNAL_PORT
  } = process.env

  let ports = {}
  series([
    function (callback) {
      if (inv.http || inv.static || inv.ws) {
        let specified = prefs?.http || n(port) || n(ARC_HTTP_PORT) || n(PORT)
        checkPort(specified || 3333, ports, 'http', true, callback)
      }
      else callback()
    },
    function (callback) {
      if (inv.events || inv.queues) {
        let specified = prefs?.events || prefs?.queues || n(ARC_EVENTS_PORT)
        checkPort(specified || 4444, ports, 'events', specified, callback)
      }
      else callback()
    },
    function (callback) {
      // TODO add support for prefs
      if (prefs?.['external-db'] || ARC_DB_EXTERNAL) {
        ports.tables = prefs?.tables || n(ARC_TABLES_PORT)
        if (ports.tables) callback()
        else callback(Error('Sandbox must be configured with a database port when relying on an external database'))
      }
      // Sandbox kicks up default sessions tables in the default project
      else if (inv.tables || !manifest) {
        let specified = prefs?.tables || n(ARC_TABLES_PORT)
        checkPort(specified || 5555, ports, 'tables', specified, callback)
      }
      else callback()
    },
    function (callback) {
      let specified = n(ARC_INTERNAL_PORT)
      checkPort(specified || 2222, ports, '_arc', false, callback)
    },
  ], function done (err) {
    if (err) callback(err)
    else {
      params.ports = ports
      update.verbose.done(`Using ports: ` +
                          `http: ${ports.http || 'n/a'}, ` +
                          `events/queues: ${ports.events || 'n/a'}, ` +
                          `tables: ${ports.tables || 'n/a'}, ` +
                          `_arc: ${ports._arc || 'n/a'}`)
      callback()
    }
  })
}

/**
 * Ensure we have access to the desired HTTP port
 */
function checkPort (checking, ports, name, single, callback) {
  let tries = 0
  let tester = net.createServer()
  let done = false
  function check () {
    if (tries === 50) {
      let msg = `Could not find open port after 50 tries, please close some applications and try again`
      return callback(Error(msg))
    }
    tester.listen(checking, 'localhost')
    tester.once('error', err => {
      if (err.message.includes('EADDRINUSE')) {
        if (single) {
          return callback(Error(`Port ${checking} (${name}) is already in use, please select another with prefs.arc`))
        }
        else {
          tries++
          checking++
          return check()
        }
      }
    })
    tester.once('listening', () => {
      tester.close(() => {
        // Tester close emits multiple events, so only call back once
        if (!done) {
          done = true
          if (Object.values(ports).includes(checking)) {
            return callback(Error(`Port conflict found on ${checking}, please specify another port`))
          }
          ports[name] = checking
          callback()
        }
      })
    })
  }
  check()
}

let { env, getPorts, checkPort } = require('../lib')
let init = require('./_init')
let dynalite = require('dynalite')
let series = require('run-series')

/**
 * Starts an in-memory Dynalite DynamoDB server
 * - Automatically creates any tables or indexes defined by the project
 * - Also creates local session table(s) just in case
 */
module.exports = function createTables (inventory) {
  let { inv } = inventory
  let { arc, manifest } = inv._project

  if (arc.tables || !manifest) {
    let hasExternalDb = process.env.ARC_DB_EXTERNAL
    let tables = {}
    let dynamo

    tables.start = function start (options, callback) {
      let { all, port, update } = options

      // Set up ports and env vars
      let { tablesPort } = getPorts(port)

      series([
        // Set up Arc + userland env vars
        function _env (callback) {
          if (!all) env({ ...options, inventory }, callback)
          else callback()
        },

        // Ensure the port is free
        function _checkPort (callback) {
          if (!hasExternalDb) {
            checkPort(tablesPort, callback)
          }
          else callback()
        },

        // Internal Arc services
        function _internal (callback) {
          if (!all) {
            // eslint-disable-next-line
            let { _arc } = require('../sandbox')
            _arc.start(options, callback)
          }
          else callback()
        },

        function _startDynalite (callback) {
          if (!hasExternalDb) {
            dynamo = dynalite({ createTableMs: 0 }).listen(tablesPort, callback)
          }
          else callback()
        },

        function _initializeTables (callback) {
          init(inventory, callback)
        }
      ],
      function _started (err) {
        if (err) callback(err)
        else {
          if (hasExternalDb) {
            update.done('@tables using external local database')
          }
          update.done('@tables created in local database')
          let msg = 'DynamoDB successfully started'
          callback(null, msg)
        }
      })

    }

    tables.end = function end (callback) {
      let msg = 'DynamoDB successfully shut down'
      if (hasExternalDb) callback(null, msg)
      else {
        dynamo.close(function _closed (err) {
          if (err) callback(err)
          else callback(null, msg)
        })
      }
    }

    return tables
  }
}

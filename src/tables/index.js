let { env } = require('../lib')
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

  if (inv.tables) {
    let hasExternalDb = process.env.ARC_DB_EXTERNAL
    let tables = {}
    let dynamo

    tables.start = function start (options, callback) {
      let { all, cwd, ports, update } = options

      // Main parameters needed throughout an invocation
      let params = { cwd, inventory, ports, update }

      series([
        // Set up Arc + userland env vars
        function _env (callback) {
          if (!all) env(params, callback)
          else callback()
        },

        // Internal Arc services
        function _internal (callback) {
          if (!all) {
            // eslint-disable-next-line
            let { _arc } = require('../sandbox')
            _arc.start(params, callback)
          }
          else callback()
        },

        function _startDynalite (callback) {
          if (!hasExternalDb) {
            let tablesPort = params.ports.tables
            dynamo = dynalite({ createTableMs: 0 }).listen(tablesPort, callback)
          }
          else callback()
        },

        function _initializeTables (callback) {
          init(params, callback)
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
        series([
          function _tablesEnd (callback) {
            dynamo.close(callback)
          },
          function _arcEnd (callback) {
            // eslint-disable-next-line
            let { _arc } = require('../sandbox')
            _arc.end(callback)
          }
        ], function _tablesEnded (err) {
          if (err) callback(err)
          else callback(null, msg)
        })
      }
    }

    return tables
  }
}

let init = require('./_init')
let dynalite = require('dynalite')
let series = require('run-series')

// Global refs for .end
let dynamo
let hasExternalDb

/**
 * Starts an in-memory Dynalite DynamoDB server
 * - Automatically creates any tables or indexes defined by the project
 * - Also creates local session table(s) just in case
 */

function start (params, callback) {
  let { inventory, ports, restart, update } = params
  let { inv } = inventory

  if (!inv.tables) {
    return callback()
  }

  hasExternalDb = process.env.ARC_DB_EXTERNAL

  series([
    function (callback) {
      if (!hasExternalDb) {
        dynamo = dynalite({ createTableMs: 0 }).listen(ports.tables, 'localhost', callback)
      }
      else callback()
    },

    function (callback) {
      init(params, callback)
    }
  ],
  function _started (err) {
    if (err) callback(err)
    else {
      if (!restart) {
        if (hasExternalDb) {
          update.done('@tables using external local database')
        }
        update.done('@tables created in local database')
      }
      callback()
    }
  })
}

function end (callback) {
  if (hasExternalDb || !dynamo) callback()
  else dynamo.close(err => {
    dynamo = undefined
    if (err) callback(err)
    else callback()
  })
}

module.exports = { start, end }

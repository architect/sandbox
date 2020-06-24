let readArc = require('../sandbox/read-arc')
let check = require('./_check-port')
let dynalite = require('dynalite')
let init = require('./_init')
let server

/**
 * Starts an in-memory Dynalite DynamoDB server
 * - Automatically creates any tables or indexes defined by the arcfile
 * - Also creates a local session table
 */
function start (callback) {
  let { arc } = readArc()
  function close (callback) {
    if (callback) callback()
  }

  if (arc.tables) {
    let port = process.env.ARC_TABLES_PORT || 5000
    let hasExternalDb = process.env.ARC_DB_EXTERNAL || false
    if (!hasExternalDb) {
      check(port, function _check (err, inUse) {
        if (err) throw err
        if (inUse) {
          server = { close }
          init(callback)
        }
        else {
          server = dynalite({
            createTableMs: 0
          }).listen(port, function _server (err) {
            if (err) {
              // if we err then the db has been started elsewhere..
              // just try to continue
              console.log(err)
            }
            init(callback)
          })
        }
      })
    }
    else {
      // Using external DB
      init(callback)
    }
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

module.exports = {
  start
}

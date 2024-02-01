let getDBClient = require('./_get-db-client')
let createTables = require('./create-table')

// Just a thin passthrough to enable the abstraction of getDBClient (for testing)
module.exports = function init ({ creds, inventory, ports }, callback) {
  getDBClient({ creds, inventory, ports }, (err, aws) => {
    if (err) return callback(err)
    createTables({ aws, inventory, ports }, callback)
  })
}

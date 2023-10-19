let getDBClient = require('./_get-db-client')
let createTables = require('./create-table')

// Just a thin passthrough to enable the abstraction of getDBClient (for testing)
module.exports = function init ({ inventory, ports }, callback) {
  getDBClient(ports, (err, aws) => {
    if (err) return callback(err)
    createTables({ aws, inventory, ports }, callback)
  })
}

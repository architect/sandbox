let createTable = require('./create-table')
let getDBClient = require('./_get-db-client')
let series = require('run-series')

module.exports = function init (inventory, callback) {
  getDBClient(function _gotDBClient (err, dynamo) {
    if (err) console.log(err) // Yes, but actually no 🏴‍☠️

    let { inv } = inventory
    let { manifest } = inv._project
    let app = inv.app

    let plans = []
    function addPlan (params) {
      plans.push(function (callback) {
        createTable({ app, dynamo, inventory, ...params }, callback)
      })
    }

    // Session table (jic)
    addPlan({
      table: {
        name: 'arc-sessions',
        partitionKey: '_idx',
        partitionKeyType: 'String'
      },
      oob: true
    })

    // Data table for possible future builtin cache
    if (!manifest) {
      addPlan({
        table: {
          name: 'data',
          partitionKey: 'scopeID',
          partitionKeyType: 'String',
          sortKey: 'dataID',
          sortKeyType: 'String',
        },
        oob: true
      })
    }

    // User tables (and their indexes)
    let tables = inv.tables || []
    tables.forEach(table => addPlan({ table }))

    series(plans, function (err) {
      if (err) {
        console.log(err)
        throw err
      }
      callback()
    })
  })
}

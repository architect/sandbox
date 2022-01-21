let createTable = require('./create-table')
let getDBClient = require('./_get-db-client')
let series = require('run-series')

module.exports = function init ({ inventory, ports }, callback) {
  getDBClient(ports, function _gotDBClient (err, dynamo) {
    if (err) console.log(err) // Yes, but actually no 🏴‍☠️

    let { inv } = inventory
    let app = inv.app

    // User tables (and their indexes)
    let plans = inv.tables.map(table => {
      return function (callback) {
        createTable({ app, dynamo, inventory, table }, callback)
      }
    })

    series(plans, function (err) {
      if (err) {
        console.log(err)
        throw err
      }
      callback()
    })
  })
}

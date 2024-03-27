let series = require('run-series')
let parallel = require('run-parallel')
let create = require('./_create-table')

/**
 * @param params Object
 * @param params.app String
 * @param params.table Object
 */
module.exports = function createTables (params, callback) {
  let { inventory } = params
  let { inv } = inventory
  let app = inv.app

  // User tables (and their indexes)
  let plans = inv.tables.map(table => {
    return function (callback) {
      parallel({
        staging: (callback) => {
          create({
            TableName: `${app}-staging-${table.name}`,
            table, ...params,
          }, callback)
        },
        production: (callback) => {
          create({
            TableName: `${app}-production-${table.name}`,
            table, ...params,
          }, callback)
        },
      }, callback)
    }
  })

  series(plans, callback)
}

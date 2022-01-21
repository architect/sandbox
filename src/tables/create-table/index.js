let parallel = require('run-parallel')
let create = require('./_create-table')

/**
 * @param params Object
 * @param params.app String
 * @param params.table Object
 */
module.exports = function createTable (params, callback) {
  let { app, table } = params
  let { name } = table

  parallel([
    function _createStaging (callback) {
      create({
        name,
        TableName: `${app}-staging-${name}`,
        ...params
      }, callback)
    },
    function _createProduction (callback) {
      create({
        name,
        TableName: `${app}-production-${name}`,
        ...params
      }, callback)
    }
  ], callback)
}

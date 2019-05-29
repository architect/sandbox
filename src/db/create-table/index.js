let parallel = require('run-parallel')
let create = require('./_create-table')

/**
 * @param params Object
 * @param params.table Object
 * @param params.app String
 * @param params.indexes Array
 */
module.exports = function createTable(params, callback) {

  var name = Object.keys(params.table)[0]
  var attr = params.table[name]
  var staging = `${params.app}-staging-${name}`
  var production = `${params.app}-production-${name}`

  parallel([
    function _createStaging(callback) {
      create(staging, attr, params.indexes, callback)
    },
    function _createProduction(callback) {
      create(production, attr, params.indexes, callback)
    }
  ],
  function _done(err) {
    if (err) {
      console.log(err)
    }
    callback()
  })
}

let parallel = require('run-parallel')
let create = require('./_create-table')

/**
 * @param params Object
 * @param params.app String
 * @param params.dynamo Object
 * @param params.indexes Array
 * @param params.table Object
 */
module.exports = function createTable (params, callback) {
  let { app, dynamo, indexes, table } = params

  let name = Object.keys(table)[0]
  let attr = table[name]

  parallel([
    function _createStaging (callback) {
      create({
        name: `${app}-staging-${name}`,
        attr,
        indexes,
        dynamo
      }, callback)
    },
    function _createProduction (callback) {
      create({
        name: `${app}-production-${name}`,
        attr,
        indexes,
        dynamo
      }, callback)
    }
  ],
  function _done (err) {
    if (err) {
      console.log(err)
    }
    callback()
  })
}

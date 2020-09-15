let series = require('run-series')
let arcEnv = require('./_arc-env')
let userEnv = require('./_user-env')

module.exports = function populateEnv (params, callback) {
  series([
    function _arcEnv (callback) {
      arcEnv(params, callback)
    },
    function _userEnv (callback) {
      userEnv(params, callback)
    },
  ], function done (err) {
    if (err) callback(err)
    else callback()
  })
}

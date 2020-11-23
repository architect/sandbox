let series = require('run-series')
let { banner } = require('@architect/utils')
let manifest = require('./_manifest')
let arcEnv = require('./_arc-env')
let userEnv = require('./_user-env')

module.exports = function populateEnv (params, callback) {
  series([
    function _arcEnv (callback) {
      arcEnv(params, callback)
    },
    function _banner (callback) {
      banner(params)
      callback()
    },
    function _manifest (callback) {
      manifest(params)
      callback()
    },
    function _userEnv (callback) {
      userEnv(params, callback)
    },
  ], function done (err) {
    if (err) callback(err)
    else callback()
  })
}

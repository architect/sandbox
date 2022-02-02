let series = require('run-series')
let plugins = require('../_plugins')
let _arc = require('../../arc')
let http = require('../../http')
let events = require('../../events')
let tables = require('../../tables')

module.exports = function end (params, callback) {
  series([
    function (callback) {
      let options = { method: 'end', name: 'shutdown' }
      plugins(params, options, callback)
    },
    function (callback) {
      http.end(callback)
    },
    function (callback) {
      events.end(callback)
    },
    function (callback) {
      tables.end(callback)
    },
    function (callback) {
      _arc.end(callback)
    },
  ], callback)
}

let _asap = require('@architect/asap')

module.exports = function runInASAP ({ request }, callback) {
  let asap = _asap({ env: 'testing' })
  asap(JSON.parse(request))
    .then(result => callback(null, result))
    .catch(callback)
}

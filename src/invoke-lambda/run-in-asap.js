let asap = require('@architect/asap')({ env: 'testing' })

module.exports = function runInASAP ({ request }, callback) {
  asap(JSON.parse(request))
    .then(result => callback(null, result))
    .catch(callback)
}

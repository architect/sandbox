let _asap = require('@architect/asap')

module.exports = function runInASAP ({ context, request }, callback) {
  let asap = _asap({
    env: 'testing',
    // `sandboxPath` named differenty because `staticPath` was too vague within ASAP
    sandboxPath: context.staticPath,
  })
  asap(JSON.parse(request))
    .then(result => callback(null, result))
    .catch(callback)
}

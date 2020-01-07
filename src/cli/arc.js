let sandbox = require('../')

/**
 * CLI entry for @architect/architect caller
 */
module.exports = function arcCalling(options) {
  sandbox.start({
    disableBanner: true,
    needsValidCreds: false,
    options
  },
  function _done(err) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
  })
}

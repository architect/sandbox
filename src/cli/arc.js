let cli = require('./index.js')

/**
 * CLI entry for @architect/architect caller
 *   Same as the CLI caller, but needs to do less
 */
module.exports = function arcCalling ({ inventory }) {
  cli({
    disableBanner: true,
    needsValidCreds: false,
    runtimeCheck: 'warn',
    inventory,
  },
  function _done (err) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
  })
}

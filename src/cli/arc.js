let inventory = require('@architect/inventory')
let cli = require('./index.js')

/**
 * CLI entry for @architect/architect caller
 *   Same as the CLI caller, but needs to do less
 */
module.exports = function arcCalling (options) {
  inventory({}, function (err, result) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    cli({
      disableBanner: true,
      needsValidCreds: false,
      options,
      inventory: result
    },
    function _done (err) {
      if (err) {
        console.log(err)
        process.exit(1)
      }
    })
  })
}

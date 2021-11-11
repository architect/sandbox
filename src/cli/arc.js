let _inventory = require('@architect/inventory')
let cli = require('./index.js')
let { getFlags } = require('../lib')
let flags = getFlags()

/**
 * CLI entry for @architect/architect caller
 *   Same as the CLI caller, but needs to do less
 */
module.exports = function arcCalling () {
  _inventory({}, function (err, inventory) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    cli({
      disableBanner: true,
      needsValidCreds: false,
      runtimeCheck: 'warn',
      inventory,
      ...flags,
    },
    function _done (err) {
      if (err) {
        console.log(err)
        process.exit(1)
      }
    })
  })
}

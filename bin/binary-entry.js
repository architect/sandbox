let _inventory = require('@architect/inventory')
let cli = require('../src/cli/index.js')
let { getFlags } = require('../src/lib')
let flags = getFlags()
let pkg = require('../package.json')
let ver = pkg.version

// Hit it
_inventory({}, function (err, inventory) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  cli({
    needsValidCreds: false,
    version: `Sandbox ${ver} (binary)`,
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

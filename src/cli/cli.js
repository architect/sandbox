#!/usr/bin/env node
let _inventory = require('@architect/inventory')
let cli = require('./index.js')
let { getFlags } = require('../lib')
let flags = getFlags()
let pkg = require('../../package.json')
let update = require('update-notifier')
let ver = pkg.version

/**
 * Entry for Sandbox running its own CLI
 *   Same as the @architect/architect caller, but calls update notifier + sets own version
 */
update({ pkg, shouldNotifyInNpmScript: true })
  .notify({ boxenOpts: {
    padding: 1,
    margin: 1,
    align: 'center',
    borderColor: 'green',
    borderStyle: 'round',
    dimBorder: true
  } })

// Hit it
_inventory({}, function (err, inventory) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  cli({
    needsValidCreds: false,
    version: `Sandbox ${ver}`,
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

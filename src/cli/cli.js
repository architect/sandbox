#!/usr/bin/env node
let inventory = require('@architect/inventory')
let cli = require('./index.js')
let pkg = require('../../package.json')
let update = require('update-notifier')
let ver = pkg.version
let options = process.argv

/**
 * Entry for Sandbox running its own CLI
 *   Same as the @architect/architect caller, but calls updater + sets own version
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
inventory({}, function (err, result) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  cli({
    needsValidCreds: false,
    options,
    version: `Sandbox ${ver}`,
    inventory: result
  },
  function _done (err) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
  })
})

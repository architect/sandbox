#!/usr/bin/env node
let cli = require('./index.js')
let pkg = require('../../package.json')
let update = require('update-notifier')
let ver = pkg.version

/**
 * Entry for Sandbox running its own CLI
 *   Same as the @architect/architect caller, but calls update notifier + sets own version
 */
update({ pkg, shouldNotifyInNpmScript: true })
  .notify({
    boxenOpts: {
      padding: 1,
      margin: 1,
      align: 'center',
      borderColor: 'green',
      borderStyle: 'round',
      dimBorder: true
    }
  })

// Hit it
cli({
  needsValidCreds: false,
  runtimeCheck: 'warn',
  version: `Sandbox ${ver}`,
},
function _done (err) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
})

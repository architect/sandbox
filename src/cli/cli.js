#!/usr/bin/env node
let cli = require('./index.js')
let pkg = require('../../package.json')
let update = require('update-notifier')
let ver = pkg.version
let options = process.argv

update({pkg, shouldNotifyInNpmScript: true})
  .notify({boxenOpts: {
    padding: 1,
    margin: 1,
    align: 'center',
    borderColor: 'green',
    borderStyle: 'round',
    dimBorder: true
  }})

// Hit it
cli({
  needsValidCreds: false,
  options,
  version: `Sandbox ${ver}`
})

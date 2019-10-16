#!/usr/bin/env node
let cli = require('./index.js')
let pkg = require('../../package.json')
let update = require('update-notifier')
let ver = pkg.version
let options = process.argv
let params = {
  options,
  version: `Sandbox ${ver}`
}

let boxenOpts = {padding: 1, margin: 1, align: 'center', borderColor: 'green', borderStyle: 'round', dimBorder: true}
update({pkg, shouldNotifyInNpmScript: true}).notify({boxenOpts})

// Hit it
cli(params)

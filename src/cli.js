#!/usr/bin/env node
let sandbox = require('./index')
let ver = require('../package.json').version
let version = `Sandbox ${ver}`
let options = process.argv
sandbox.start({version, options}, function _done(err) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
})

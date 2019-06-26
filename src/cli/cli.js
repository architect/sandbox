#!/usr/bin/env node
let cli = require('./index.js')
let ver = require('../../package.json').version
let options = process.argv
let params = {
  options,
  version: `Sandbox ${ver}`
}
cli(params)

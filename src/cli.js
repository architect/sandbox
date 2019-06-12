#!/usr/bin/env node
let sandbox = require('./index')
let ver = require('../package.json').version
let version = `Sandbox ${ver}`
sandbox.start({version})

#! /usr/bin/env node

let { execSync } = require('child_process')
let cwd = __dirname
let options = { cwd, stdio: 'inherit' }

execSync('npm install --force --omit=dev', options)
execSync('npx esbuild ./aws-lite-dynamodb.mjs --bundle --platform=node --format=cjs --outfile=../src/tables/_aws-lite-dynamodb-vendor.js', options)

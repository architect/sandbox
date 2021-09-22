let { join } = require('path')
let { existsSync } = require('fs')
let { sync: rm } = require('rimraf')
let { NOISY_TESTS, CI } = process.env

let b64dec = i => Buffer.from(i, 'base64').toString()

let copy = thing => JSON.parse(JSON.stringify(thing))

// Dummy AWS creds
let credentials = {
  accessKeyId: 'xxx',
  secretAccessKey: 'xxx',
}

let data = { hi: 'there' }

let port = 6666

// Enable NOISY_TESTS for local debugging
let quiet = NOISY_TESTS === 'true' ? false : true
if (NOISY_TESTS && CI) {
  throw Error('Noisy tests cannot be enabled in CI!')
}

let url = `http://localhost:${port}`
let wsUrl = `ws://localhost:${port}`

function rmPublic (t) {
  try {
    let publicFolder = join(process.cwd(), 'public')
    rm(publicFolder)
    t.notOk(existsSync(publicFolder), 'Destroyed auto-generated ./public folder')
  }
  catch (err) {
    t.fail(err)
  }
}

// Integration test runner
let bin = join(process.cwd(), 'bin', `sandbox-binary${process.platform.startsWith('win') ? '.exe' : ''}`)
let run = (runTests, t) => {
  if (!process.env.BINARY_ONLY) {
    runTests('module', t)
  }
  if (!process.env.MODULE_ONLY && existsSync(bin)) {
    runTests('binary', t)
  }
}

let _refreshInventory = true

module.exports = {
  b64dec,
  copy,
  credentials,
  data,
  port,
  quiet,
  rmPublic,
  run,
  url,
  wsUrl,
  _refreshInventory
}

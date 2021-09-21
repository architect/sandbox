let { join } = require('path')
let { sync: rm } = require('rimraf')
let { existsSync } = require('fs')
let { NOISY_TESTS, CI } = process.env

let b64dec = i => Buffer.from(i, 'base64').toString()

let copy = thing => JSON.parse(JSON.stringify(thing))

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

let _refreshInventory = true

module.exports = {
  b64dec,
  copy,
  data,
  port,
  quiet,
  rmPublic,
  url,
  wsUrl,
  _refreshInventory
}

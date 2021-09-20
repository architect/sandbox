let { join } = require('path')
let { sync: rm } = require('rimraf')
let { existsSync } = require('fs')

let b64dec = i => Buffer.from(i, 'base64').toString()

let copy = thing => JSON.parse(JSON.stringify(thing))

let data = { hi: 'there' }

let port = 6666

let quiet = process.env.NOISY_TESTS === 'true' ? false : true

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

module.exports = {
  b64dec,
  copy,
  data,
  port,
  quiet,
  rmPublic,
  url,
  wsUrl,
}

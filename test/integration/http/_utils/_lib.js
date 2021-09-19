let { join } = require('path')
let { sync: rm } = require('rimraf')
let { existsSync } = require('fs')
let { getPorts } = require(join(process.cwd(), 'src', 'lib', 'ports'))
let { httpPort } = getPorts()

let b64dec = i => Buffer.from(i, 'base64').toString()

let copy = thing => JSON.parse(JSON.stringify(thing))

let data = { hi: 'there' }

let url = `http://localhost:${httpPort}`
let wsUrl = `ws://localhost:${httpPort}`

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
  url,
  wsUrl,
  rmPublic
}

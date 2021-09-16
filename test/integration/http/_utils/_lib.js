let { join } = require('path')
let { sync: rm } = require('rimraf')
let { existsSync } = require('fs')

let b64dec = i => Buffer.from(i, 'base64').toString()

let data = { hi: 'there' }

let url = `http://localhost:${process.env.PORT || 3333}`

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
  data,
  url,
  rmPublic
}

let os = require('os')
let fs = require('fs')
let { promisify } = require('util')
let { join } = require('path')

module.exports = {
  start: async function (arc, inventory, buildInServices) {
    await promisify(fs.writeFile(join(os.tmpdir(), 'asyncplugin.test'), 'test'))
  },
  end: async function (arc, inventory, buildInServices) {
    await promisify(fs.unlink(join(os.tmpdir(), 'asyncplugin.test')))
  }
}

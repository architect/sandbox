let fs = require('fs')
let { promisify } = require('util')
let { join } = require('path')
let file = join(__dirname, '..', '..', 'asyncplugin.test')
let write = promisify(fs.writeFile)
let rm = promisify(fs.unlink)

module.exports = {
  sandbox: {
    start: async function ({ arc, inventory, services }) {
      console.log('async plugin start hook writing', file)
      await write(file, 'test', { encoding: 'utf-8' })
    },
    end: async function ({ arc, inventory, services }) {
      console.log('async plugin end hook unlinking', file)
      await rm(file)
    }
  }
}

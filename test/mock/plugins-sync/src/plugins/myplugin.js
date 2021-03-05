let os = require('os')
let fs = require('fs')
let { join } = require('path')
let file = join(process.cwd(), 'syncplugin.test')

module.exports = {
  sandbox: {
    start: function ({ arc, inventory, services }, callback) {
      fs.writeFileSync(file, 'test')
      callback()
    },
    end: function ({ arc, inventory, services }, callback) {
      fs.unlinkSync(file, 'syncplugin.test')
      callback()
    }
  }
}

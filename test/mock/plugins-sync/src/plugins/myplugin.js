let os = require('os')
let fs = require('fs')
let { join } = require('path')

module.exports = {
  start: function (arc, inventory, buildInServices, callback) {
    fs.writeFileSync(join(os.tmpdir(), 'syncplugin.test'), 'test')
    callback()
  },
  end: function (arc, inventory, buildInServices, callback) {
    fs.unlinkSync(join(os.tmpdir(), 'syncplugin.test'))
    callback()
  }
}

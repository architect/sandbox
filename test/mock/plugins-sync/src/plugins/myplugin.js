let os = require('os')
let fs = require('fs')
let { join } = require('path')
let file = join(process.cwd(), 'syncplugin.test')

module.exports = {
  variables: function ({ arc, stage, inventory }) {
    return {
      varOne: 'valueOne'
    }
  },
  sandbox: {
    start: function ({ arc, inventory, services }, callback) {
      fs.writeFileSync(file, 'test')
      callback()
    },
    end: function ({ arc, inventory, services }, callback) {
      if (fs.existsSync(file)) fs.unlinkSync(file, 'syncplugin.test')
      callback()
    }
  }
}

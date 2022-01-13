let os = require('os')
let fs = require('fs')
let { join } = require('path')
let file = join(__dirname, '..', '..', 'syncplugin.test')

module.exports = {
  variables: function ({ arc, stage, inventory }) {
    return {
      varOne: 'valueOne'
    }
  },
  sandbox: {
    start: function ({ arc, inventory }) {
      console.log('sync plugin start hook writing', file)
      fs.writeFileSync(file, 'test')
    },
    end: function ({ arc, inventory }) {
      console.log('sync plugin end hook unlinking', file)
      if (fs.existsSync(file)) fs.unlinkSync(file, 'syncplugin.test')
    }
  }
}

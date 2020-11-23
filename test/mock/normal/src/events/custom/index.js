let { join } = require('path')
let { writeFileSync } = require('fs')

exports.handler = async function normal (payload) {
  let { filename, message } = JSON.parse(payload.Records[0].Sns.Message)
  let file = join(__dirname, '..', '..', '..', '..', 'tmp', filename)
  writeFileSync(file, message)
  return
}

const { promisify } = require('util')
const fs = require('fs')

const readFile = promisify(fs.readFile)

exports.handler = async (event) => {
  const favicon = await readFile('./favicon.ico')
  const response = {
    headers: { 'content-type': 'image/x-icon' },
    isBase64Encoded: true,
    body: favicon.toString('base64'),
  }
  return response
}

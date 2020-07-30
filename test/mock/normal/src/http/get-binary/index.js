const { promisify } = require('util')
const { readFile } = require('fs')
const read = promisify(readFile)

exports.handler = async (event) => {
  const favicon = await read('./favicon.ico')
  const headers = { 'content-type': 'image/x-icon' }
  if (event.version) headers.version = event.version
  return {
    statusCode: 200,
    headers,
    isBase64Encoded: true,
    body: favicon.toString('base64'),
  }
}

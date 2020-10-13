const { promisify } = require('util')
const { readFile } = require('fs')
const read = promisify(readFile)

exports.handler = async (event) => {
  const favicon = await read('./favicon.ico')
  const body = event
  body.message = 'Hello from get /binary'
  return {
    statusCode: 200,
    headers: {
      'content-type': 'image/x-icon',
      body: JSON.stringify(body)
    },
    isBase64Encoded: true,
    body: favicon.toString('base64'),
  }
}

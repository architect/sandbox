let arc = require('@architect/functions')
let tiny = require('tiny-json-http')

exports.handler = async function ws (event) {
  await tiny.post({
    url: 'http://localhost:3433/',
    body: {
      functionName: 'error',
      event,
    },
  })
  return { statusCode: 500 }
}

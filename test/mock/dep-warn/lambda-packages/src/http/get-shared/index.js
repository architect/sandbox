let lambda = require('lambda-dep')
let shared = require('@architect/shared')
let oob = require('@architect/inventory')

exports.handler = async function http (req) {
  return {
    statusCode: 200,
    body: 'Henlo'
  }
}

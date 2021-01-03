let lambda = require('lambda-dep')
let root = require('root-dep')
let views = require('@architect/views')
let oob = require('@architect/inventory')

exports.handler = async function http (req) {
  return {
    statusCode: 200,
    body: 'Henlo'
  }
}

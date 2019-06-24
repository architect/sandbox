let AWS = require('aws-sdk')
let endpoint = new AWS.Endpoint('http://localhost:5000')
let region = 'us-west-2'

/**
 * Populate AWS env vars necessary to init
 * Technically only AWS_SECRET_ACCESS_KEY + AWS_ACCESS_KEY_ID required, but populate AWS_PROFILE + AWS_REGION jic
 */
if (process.env.AWS_PROFILE) {
  process.env.AWS_PROFILE = 'xxx'
}
if (!process.env.AWS_REGION) {
  process.env.AWS_REGION = 'us-west-2'
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  process.env.AWS_SECRET_ACCESS_KEY = 'xxx'
}
if (!process.env.AWS_ACCESS_KEY_ID) {
  process.env.AWS_ACCESS_KEY_ID = 'xxx'
}

let dynamo = new AWS.DynamoDB({endpoint, region})

module.exports = dynamo

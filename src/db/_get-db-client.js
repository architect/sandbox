let aws = require('aws-sdk')
let endpoint = new aws.Endpoint('http://localhost:5000')
let region = 'us-west-2'

/**
 * Final DynamoDB credentials backstop
 * - Creds are usually loaded via banner
 * - Populate AWS env vars necessary to init if somehow not loaded (e.g. perhaps in a testing environment)
 * - Only AWS_SECRET_ACCESS_KEY + AWS_ACCESS_KEY_ID are technically required to initialize
 */
let creds = aws.config.credentials
if (!creds) {
  process.env.AWS_SECRET_ACCESS_KEY = 'xxx'
  process.env.AWS_ACCESS_KEY_ID = 'xxx'
}

let dynamo = new aws.DynamoDB({endpoint, region})

module.exports = dynamo

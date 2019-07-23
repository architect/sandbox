let AWS = require('aws-sdk')
let chalk = require('chalk')
let chars = require('@architect/utils').chars
let endpoint = new AWS.Endpoint('http://localhost:5000')
let region = 'us-west-2'

/**
 * Populate AWS env vars necessary to init if not loaded from local AWS credentials file
 * (Technically only AWS_SECRET_ACCESS_KEY + AWS_ACCESS_KEY_ID required to initialize db)
 * TODO this impl assumes that the presence of AWS_PROFILE means the sdk successfully loaded credentials, which may not be the case; need to add actual creds check and set dummy AWS_SECRET_ACCESS_KEY + AWS_ACCESS_KEY_ID if necessary
 */
let missingProfile = !process.env.AWS_PROFILE
let missingSecretAccessKey = !process.env.AWS_SECRET_ACCESS_KEY
let missingAccessKeyId = !process.env.AWS_ACCESS_KEY_ID
if (missingProfile && missingSecretAccessKey && missingAccessKeyId) {
  process.env.AWS_PROFILE = 'xxx'
  process.env.AWS_SECRET_ACCESS_KEY = 'xxx'
  process.env.AWS_ACCESS_KEY_ID = 'xxx'
}

let dynamo = new AWS.DynamoDB({endpoint, region})

// Backstop missing credentials so aws-sdk doesn't stall sandbox initialization
if (dynamo.config && !dynamo.config.credentials) {
  console.log(chalk.grey(chars.done, 'Starting up without AWS credentials'))
  process.env.AWS_SECRET_ACCESS_KEY = 'xxx'
  process.env.AWS_ACCESS_KEY_ID = 'xxx'
}

module.exports = dynamo

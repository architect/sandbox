let aws = require('aws-sdk')

module.exports = function initDynamoClient (callback) {
  /**
   * Final DynamoDB credentials backstop
   * - Creds are usually loaded for the process via banner's AWS initialization routines
   * - Assumes that aws.config.credentials is present if aws-sdk successfully loaded valid credentials
   * - Populate AWS-specific env vars necessary to mock Lambda + make SDK calls if not already loaded
   * - Only AWS_SECRET_ACCESS_KEY + AWS_ACCESS_KEY_ID are technically required to mock Lambda
   */
  let creds = aws.config.credentials
  if (!process.env.AWS_ACCESS_KEY_ID && creds && creds.accessKeyId) {
    process.env.AWS_ACCESS_KEY_ID = creds.accessKeyId
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY && creds && creds.secretAccessKey) {
    process.env.AWS_SECRET_ACCESS_KEY = creds.secretAccessKey
  }
  if (!creds) {
    // These env vars *should* already be instantiated by utils >= 1.4.7 – but do it jic!
    process.env.AWS_SECRET_ACCESS_KEY = 'xxx'
    process.env.AWS_ACCESS_KEY_ID = 'xxx'
  }

  let tablesPort = process.env.ARC_TABLES_PORT || 5000
  let endpoint = new aws.Endpoint(`http://localhost:${tablesPort}`)
  let region = process.env.AWS_REGION || 'us-west-2'
  let dynamo = new aws.DynamoDB({ endpoint, region })
  callback(null, dynamo)
}

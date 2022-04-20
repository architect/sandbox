let aws = require('aws-sdk')

module.exports = function initDynamoClient (ports, callback) {
  /**
   * Final DynamoDB credentials backstop
   * - Creds are usually loaded for the process via banner's AWS initialization routines
   * - Assumes that aws.config.credentials is present if aws-sdk successfully loaded valid credentials
   * - Populate AWS-specific env vars necessary to mock Lambda + make SDK calls if not already loaded
   * - Only AWS_SECRET_ACCESS_KEY + AWS_ACCESS_KEY_ID are technically required to mock Lambda
   */
  let creds = aws.config.credentials

  // Fail loudly and early if a creds file is present without a default profile
  if (Array.isArray(creds) && !creds.length) {
    let msg = `AWS credentials file found without a 'default' profile; you must add a default profile, specify a different profile, or remove your credentials file`
    return callback(ReferenceError(msg))
  }

  if (!process.env.AWS_ACCESS_KEY_ID && creds?.accessKeyId) {
    process.env.AWS_ACCESS_KEY_ID = creds.accessKeyId
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY && creds?.secretAccessKey) {
    process.env.AWS_SECRET_ACCESS_KEY = creds.secretAccessKey
  }
  if (!creds) {
    // These env vars *should* already be instantiated by utils >= 1.4.7 – but do it jic!
    process.env.AWS_SECRET_ACCESS_KEY = 'xxx'
    process.env.AWS_ACCESS_KEY_ID = 'xxx'
  }

  let config = {
    endpoint: `http://localhost:${ports.tables}`,
    region: process.env.AWS_REGION || 'us-west-2',
  }
  let dynamo = new aws.DynamoDB(config)
  let document = new aws.DynamoDB.DocumentClient(config)
  callback(null, dynamo, document)
}

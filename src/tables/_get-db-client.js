let { join } = require('path')
let awsLite = require('@aws-lite/client')

module.exports = function initDynamoClient (ports, callback) {
  /**
   * Final DynamoDB credentials backstop
   * - Assumes credentials are loaded via aws-lite
   * - Populate AWS-specific env vars necessary to mock Lambda + make SDK calls if not already loaded
   * - Only AWS_SECRET_ACCESS_KEY + AWS_ACCESS_KEY_ID are technically required to mock Lambda
   */
  let plugins = []
  // Binary dist mode
  if (process.pkg) {
    plugins.push(join(__dirname, '_aws-lite-dynamodb-vendor.js'))
  }
  else plugins.push('@aws-lite/dynamodb')
  let config = {
    autoloadPlugins: false,
    host: 'localhost',
    plugins,
    port: ports.tables,
    protocol: 'http',
    region: process.env.AWS_REGION || 'us-west-2',
  }
  function go (aws) {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      process.env.AWS_ACCESS_KEY_ID = aws.credentials.accessKeyId
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      process.env.AWS_SECRET_ACCESS_KEY = aws.credentials.secretAccessKey
    }
    callback(null, aws)
  }
  awsLite(config)
    .then(go)
    .catch(err => {
      if (err.message.match(/You must supply AWS credentials/)) {
        let dummy = 'xxx'
        // These env vars *should* already be instantiated by utils >= 1.4.7 – but do it jic!
        // TODO remove this junk after implementing aws-lite
        process.env.AWS_SECRET_ACCESS_KEY = dummy
        process.env.AWS_ACCESS_KEY_ID = dummy
        config.accessKeyId = config.secretAccessKey = dummy
        awsLite(config).then(go).catch(callback)
      }
      else callback(err)
    })
}

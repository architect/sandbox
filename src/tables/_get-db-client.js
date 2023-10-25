let { join } = require('path')
let awsLite = require('@aws-lite/client')

module.exports = function initDynamoClient ({ creds, ports }, callback) {
  let plugins = [
    // Binary dist mode
    process.pkg
      ? join(__dirname, '_aws-lite-dynamodb-vendor.js')
      : '@aws-lite/dynamodb'
  ]
  let config = {
    autoloadPlugins: false,
    host: 'localhost',
    plugins,
    port: ports.tables,
    protocol: 'http',
    region: process.env.AWS_REGION || 'us-west-2',
    ...creds,
  }
  awsLite(config)
    .then(client => callback(null, client))
    .catch(callback)
}

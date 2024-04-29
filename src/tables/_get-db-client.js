let { join } = require('path')
let awsLite = require('@aws-lite/client')

module.exports = function initDynamoClient ({ creds, inventory, ports }, callback) {
  let plugins = [
    // Binary dist mode
    process.pkg
      ? require(join(__dirname, '_aws-lite-dynamodb-vendor.js'))
      : import('@aws-lite/dynamodb'),
  ]
  let config = {
    autoloadPlugins: false,
    endpoint: `http://localhost:${ports.tables}`,
    plugins,
    profile: inventory.inv?.aws?.profile,
    region: inventory.inv?.aws?.region || process.env.AWS_REGION || 'us-west-2',
    ...creds,
  }
  awsLite(config)
    .then(client => callback(null, client))
    .catch(callback)
}

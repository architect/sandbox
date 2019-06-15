let { DynamoDB } = require('@aws-sdk/client-dynamodb-node/DynamoDB');
let endpoint = 'http://localhost:5000'
let region= 'us-west-2'
let dynamo = new DynamoDB({endpoint, region})

module.exports = dynamo

let AWS = require('aws-sdk')
let endpoint = new AWS.Endpoint('http://localhost:5000')
let region= 'us-west-2'
let dynamo = new AWS.DynamoDB({endpoint, region})

module.exports = dynamo

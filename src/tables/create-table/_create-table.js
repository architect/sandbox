let getAttributeDefinitions = require('./_get-attribute-definitions')
let getKeySchema = require('./_get-key-schema')
let getGSI = require('./_get-global-secondary-index')

module.exports = function _createTable (params, callback) {
  let { name, TableName, dynamo, inventory, ports, table } = params

  dynamo.listTables({}, function _tables (err, result) {
    if (err) {
      console.log(err)
      if (err.message === 'socket hung up' &&
          err.name === 'TimeoutError' &&
          err.stack.includes('aws-sdk')) {
        let msg = `Sandbox was unable to instantiate database tables on port ${ports.tables} due to a timeout error\n` +
              `This has been known to occur when system emulators (or tools use them) attempt to use port ${ports.tables}\n` +
              `Please ensure you are not running any such emulators or tools, or manually specify a different @tables port, and try starting Sandbox again`
        console.log(msg)
        process.exit(1)
      }
      let msg = 'Unable to list DynamoDB tables'
      throw Error(msg)
    }
    else {
      let found = result.TableNames.find(tbl => tbl === TableName)
      if (found) callback()
      else {
        let creating = {
          TableName,
          AttributeDefinitions: getAttributeDefinitions(params),
          KeySchema: getKeySchema(table),
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }

        // Handle global secondary index stuff
        let gsi = getGSI({ name, inventory })
        if (gsi) creating.GlobalSecondaryIndexes = gsi

        dynamo.createTable(creating, callback)
      }
    }
  })
}

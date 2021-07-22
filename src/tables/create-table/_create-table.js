let getAttributeDefinitions = require('./_get-attribute-definitions')
let getKeySchema = require('./_get-key-schema')
let getGSI = require('./_get-global-secondary-index')

module.exports = function _createTable (params, callback) {
  let { name, TableName, dynamo, inventory, table } = params

  dynamo.listTables({}, function _tables (err, result) {
    if (err) {
      // Blow up if a programmer config err
      console.log(err)
      throw Error('Unable to list DynamoDB tables')
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

let getAttributeDefinitions = require('./_get-attribute-definitions')
let getKeySchema = require('./_get-key-schema')
let clean = require('./_remove-ttl-and-lambda')
let getGSI = require('./_get-global-secondary-index')
let getAttributeDefinitionsWithGsi = require('./_get-attribute-definitions-with-gsi')

module.exports = function _createTable (params, callback) {
  let { name, attr, indexes, dynamo } = params
  let keys = Object.keys(clean(attr))
  let list = errback => dynamo.listTables({}, errback)

  list(function _tables (err, result) {
    if (err) {
      // blow up if a programmer config err
      console.log(err)
      throw Error('Unable to list Dynamo tables')
    }
    else {
      let found = result.TableNames.find(tbl => tbl === name)
      if (found) {
        callback()
      }
      else {
        let params = {
          TableName: name,
          AttributeDefinitions: getAttributeDefinitions(clean(attr)),
          KeySchema: getKeySchema(attr, keys),
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
        let gsi = getGSI(name, indexes)
        if (gsi) {
          params.AttributeDefinitions = getAttributeDefinitionsWithGsi(attr, name, indexes)
          params.GlobalSecondaryIndexes = gsi
        }
        dynamo.createTable(params, function _create (err) {
          if (err) throw err
          callback()
        })
      }
    }
  })
}
